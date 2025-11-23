import get from 'lodash/get';
import { PrivateKey } from '../auth/ecc/src/key_private';
import { Api } from '../api';

export interface Account {
    name: string;
    vesting_shares: string;
    balance: string;
    savings_balance: string;
    savings_sbd_balance: string;
    sbd_balance: string;
    other_history?: any[];
}

export interface GlobalProperties {
    total_vesting_shares: string;
    total_vesting_fund_steem: string;
}

export interface FeedPrice {
    base: string;
    quote: string;
}

export interface OpenOrder {
    sell_price: {
        base: string;
    };
    for_sale: number;
}

export interface SavingsWithdraw {
    amount: string;
}

export interface AccountValueOptions {
    gprops?: GlobalProperties;
    feed_price?: FeedPrice;
    open_orders?: OpenOrder[];
    savings_withdraws?: SavingsWithdraw[];
    vesting_steem?: number;
}

export function formatAmount(amount: number | string, symbol: string = 'STEEM'): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${numAmount.toFixed(3)} ${symbol}`;
}

export function formatVests(vests: number | string): string {
    const numVests = typeof vests === 'string' ? parseFloat(vests) : vests;
    return `${numVests.toFixed(6)} VESTS`;
}

export function formatReputation(reputation: number | string | null | undefined, decimal_places: number = 0): string {
    if (reputation == 0) {
        if (decimal_places > 0) {
            return (25).toFixed(decimal_places);
        }
        return '25';
    }
    if (!reputation || isNaN(Number(reputation)) || !isFinite(Number(reputation))) {
        if (decimal_places > 0) {
            return (25).toFixed(decimal_places);
        }
        return '25';
    }
    
    const numRep = typeof reputation === 'string' ? parseFloat(reputation) : reputation;
    const neg = numRep < 0;
    const rep = Math.abs(numRep);
    
    // Calculate reputation score
    const v = Math.log10(Math.max(Math.abs(rep) - 10, 0)) - 9;
    const finalV = (neg ? -v : v) * 9 + 25;
    
    if (decimal_places > 0) {
        return Number(Math.round(Number(finalV + 'e+' + decimal_places)) + 'e-' + decimal_places).toFixed(decimal_places);
    }
    return parseInt(finalV.toString(), 10).toString();
}

export function formatPercent(value: number | string): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${(numValue * 100).toFixed(2)}%`;
}

export function formatTime(time: Date | number | string): string {
    let date: Date;
    if (typeof time === 'string') {
        date = new Date(time);
    } else if (typeof time === 'number') {
        date = new Date(time);
    } else {
        date = time;
    }
    return date.toISOString();
}

export function formatNumber(value: number | string, decimals: number = 2): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toFixed(decimals);
}

export class Formatter {
    private api: Api;

    constructor(api: Api) {
        this.api = api;
    }

    private vestingSteem(account: Account, gprops: GlobalProperties): number {
        const vests = parseFloat(account.vesting_shares.split(' ')[0]);
        const total_vests = parseFloat(gprops.total_vesting_shares.split(' ')[0]);
        const total_vest_steem = parseFloat(gprops.total_vesting_fund_steem.split(' ')[0]);
        const vesting_steemf = total_vest_steem * (vests / total_vests);
        return vesting_steemf;
    }

    private processOrders(open_orders: OpenOrder[] | undefined, assetPrecision: number): { steemOrders: number; sbdOrders: number } {
        const sbdOrders = !open_orders
            ? 0
            : open_orders.reduce((o, order) => {
                if (order.sell_price.base.indexOf('SBD') !== -1) {
                    o += order.for_sale;
                }
                return o;
            }, 0) / assetPrecision;

        const steemOrders = !open_orders
            ? 0
            : open_orders.reduce((o, order) => {
                if (order.sell_price.base.indexOf('STEEM') !== -1) {
                    o += order.for_sale;
                }
                return o;
            }, 0) / assetPrecision;

        return { steemOrders, sbdOrders };
    }

    private calculateSaving(savings_withdraws: SavingsWithdraw[]): { savings_pending: number; savings_sbd_pending: number } {
        let savings_pending = 0;
        let savings_sbd_pending = 0;
        savings_withdraws.forEach(withdraw => {
            const [amount, asset] = withdraw.amount.split(' ');
            if (asset === 'STEEM') savings_pending += parseFloat(amount);
            else {
                if (asset === 'SBD') savings_sbd_pending += parseFloat(amount);
            }
        });
        return { savings_pending, savings_sbd_pending };
    }

    private pricePerSteem(feed_price: FeedPrice): number | undefined {
        let price_per_steem: number | undefined = undefined;
        const { base, quote } = feed_price;
        if (/ SBD$/.test(base) && / STEEM$/.test(quote)) {
            price_per_steem = parseFloat(base.split(' ')[0]) / parseFloat(quote.split(' ')[0]);
        }
        return price_per_steem;
    }

    async estimateAccountValue(account: Account, options: AccountValueOptions = {}): Promise<string> {
        const promises: Promise<any>[] = [];
        const username = account.name;
        const assetPrecision = 1000;
        let orders: { steemOrders: number; sbdOrders: number };
        let savings: { savings_pending: number; savings_sbd_pending: number };
        let { gprops, feed_price, open_orders, savings_withdraws, vesting_steem } = options;

        if (!vesting_steem || !feed_price) {
            if (!gprops || !feed_price) {
                promises.push(
                    (this.api as any).getStateAsync(`/@${username}`).then((data: any) => {
                        gprops = data.props;
                        feed_price = data.feed_price;
                        if (gprops) {
                            vesting_steem = this.vestingSteem(account, gprops);
                        }
                    })
                );
            } else if (gprops) {
                vesting_steem = this.vestingSteem(account, gprops);
            }
        }

        if (!open_orders) {
            promises.push(
                (this.api as any).getOpenOrdersAsync(username).then((open_orders: OpenOrder[]) => {
                    orders = this.processOrders(open_orders, assetPrecision);
                })
            );
        } else {
            orders = this.processOrders(open_orders, assetPrecision);
        }

        if (!savings_withdraws) {
            promises.push(
                (this.api as any)
                    .getSavingsWithdrawFromAsync(username)
                    .then((savings_withdraws: SavingsWithdraw[]) => {
                        savings = this.calculateSaving(savings_withdraws);
                    })
            );
        } else {
            savings = this.calculateSaving(savings_withdraws);
        }

        return Promise.all(promises).then(() => {
            let price_per_steem = this.pricePerSteem(feed_price!);

            const savings_balance = account.savings_balance;
            const savings_sbd_balance = account.savings_sbd_balance;
            const balance_steem = parseFloat(account.balance.split(' ')[0]);
            const saving_balance_steem = parseFloat(savings_balance.split(' ')[0]);
            const sbd_balance = parseFloat(account.sbd_balance);
            const sbd_balance_savings = parseFloat(savings_sbd_balance.split(' ')[0]);

            let conversionValue = 0;
            const currentTime = new Date().getTime();
            (account.other_history || []).reduce((out, item) => {
                if (get(item, [1, 'op', 0], '') !== 'convert') return out;

                const timestamp = new Date(get(item, [1, 'timestamp'])).getTime();
                const finishTime = timestamp + 86400000 * 3.5; // add 3.5day conversion delay
                if (finishTime < currentTime) return out;

                const amount = parseFloat(
                    get(item, [1, 'op', 1, 'amount']).replace(' SBD', '')
                );
                conversionValue += amount;
                return out;
            }, []);

            const total_sbd =
                sbd_balance +
                sbd_balance_savings +
                savings.savings_sbd_pending +
                orders.sbdOrders +
                conversionValue;

            const total_steem =
                vesting_steem! +
                balance_steem +
                saving_balance_steem +
                savings.savings_pending +
                orders.steemOrders;

            return (total_steem * price_per_steem! + total_sbd).toFixed(2);
        });
    }

    createSuggestedPassword(): string {
        const PASSWORD_LENGTH = 32;
        const privateKey = PrivateKey.fromBuffer(Buffer.from(Array(32).fill(0).map(() => Math.floor(Math.random() * 256))));
        return privateKey.toWif().substring(3, 3 + PASSWORD_LENGTH);
    }

    reputation(reputation: number | null | undefined, decimal_places: number = 0): number | null | undefined {
        if (reputation == null) return reputation;
        if (reputation === 0) return 25;
        let neg = reputation < 0;
        let rep = String(reputation);
        rep = neg ? rep.substring(1) : rep;
        let v = (Math.log10((parseInt(rep) > 0 ? parseInt(rep) : -parseInt(rep)) - 10) - 9);
        v = neg ? -v : v;
        v = v * 9 + 25;
        if (decimal_places > 0) {
            const multiplier = Math.pow(10, decimal_places);
            return Math.round(v * multiplier) / multiplier;
        }
        return parseInt(v as any);
    }

    vestToSteem(vestingShares: string, totalVestingShares: string, totalVestingFundSteem: string): number {
        return (
            parseFloat(totalVestingFundSteem) *
            (parseFloat(vestingShares) / parseFloat(totalVestingShares))
        );
    }

    commentPermlink(parentAuthor: string, parentPermlink: string): string {
        const timeStr = new Date()
            .toISOString()
            .replace(/[^a-zA-Z0-9]+/g, '')
            .toLowerCase();
        parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, '');
        let permLink = 're-' + parentAuthor + '-' + parentPermlink + '-' + timeStr;
        if (permLink.length > 255) {
            // pay respect to STEEMIT_MAX_PERMLINK_LENGTH
            permLink = permLink.substr(permLink.length - 255, permLink.length);
        }
        // permlinks must be lower case and not contain anything but
        // alphanumeric characters plus dashes
        return permLink.toLowerCase().replace(/[^a-z0-9-]+/g, '');
    }
}

/**
 * Calculate vesting STEEM from vesting shares and global properties.
 * @param account Account object
 * @param gprops GlobalProperties object
 * @returns Number of STEEM
 */
export function vestingSteem(account: Account, gprops: GlobalProperties): number {
    const vests = parseFloat(account.vesting_shares.split(' ')[0]);
    const total_vests = parseFloat(gprops.total_vesting_shares.split(' ')[0]);
    const total_vest_steem = parseFloat(gprops.total_vesting_fund_steem.split(' ')[0]);
    const vesting_steemf = total_vest_steem * (vests / total_vests);
    return vesting_steemf;
}

/**
 * Calculate price per STEEM from feed price.
 * @param feed_price FeedPrice object
 * @returns Price per STEEM or undefined
 */
export function pricePerSteem(feed_price: FeedPrice): number | undefined {
    let price_per_steem: number | undefined = undefined;
    const { base, quote } = feed_price;
    if (/ SBD$/.test(base) && / STEEM$/.test(quote)) {
        price_per_steem = parseFloat(base.split(' ')[0]) / parseFloat(quote.split(' ')[0]);
    }
    return price_per_steem;
}

/**
 * Alias for formatAmount for backward compatibility.
 */
export const amount = formatAmount;

/**
 * Convert vesting shares to STEEM.
 * @param vestingShares Vesting shares string
 * @param totalVestingShares Total vesting shares string
 * @param totalVestingFundSteem Total vesting fund STEEM string
 * @returns Number of STEEM
 */
export function vestToSteem(vestingShares: string, totalVestingShares: string, totalVestingFundSteem: string): number {
    return (
        parseFloat(totalVestingFundSteem) *
        (parseFloat(vestingShares) / parseFloat(totalVestingShares))
    );
}

/**
 * Generate a comment permlink based on parent author and permlink.
 * @param parentAuthor Parent author string
 * @param parentPermlink Parent permlink string
 * @returns Generated permlink string
 */
export function commentPermlink(parentAuthor: string, parentPermlink: string): string {
    const timeStr = new Date()
        .toISOString()
        .replace(/[^a-zA-Z0-9]+/g, '')
        .toLowerCase();
    parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, '');
    let permLink = 're-' + parentAuthor + '-' + parentPermlink + '-' + timeStr;
    if (permLink.length > 255) {
        // pay respect to STEEMIT_MAX_PERMLINK_LENGTH
        permLink = permLink.substr(permLink.length - 255, permLink.length);
    }
    // permlinks must be lower case and not contain anything but
    // alphanumeric characters plus dashes
    return permLink.toLowerCase().replace(/[^a-z0-9-]+/g, '');
}

/**
 * Calculate Steem reputation score as a number, matching the original implementation.
 * @param reputation Raw reputation value
 * @param decimal_places Number of decimal places (optional)
 * @returns Reputation score as number, or null/undefined if input is null/undefined
 */
export function reputation(reputation: number | null | undefined, decimal_places: number = 0): number | null | undefined {
    if (reputation == null) return reputation;
    if (reputation === 0) return 25;
    let neg = reputation < 0;
    let rep = String(reputation);
    rep = neg ? rep.substring(1) : rep;
    let v = (Math.log10((parseInt(rep) > 0 ? parseInt(rep) : -parseInt(rep)) - 10) - 9);
    v = neg ? -v : v;
    v = v * 9 + 25;
    if (decimal_places > 0) {
        const multiplier = Math.pow(10, decimal_places);
        return Math.round(v * multiplier) / multiplier;
    }
    return parseInt(v as any);
} 