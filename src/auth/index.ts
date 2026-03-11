import { PrivateKey } from './ecc/src/key_private';
import { PublicKey } from './ecc/src/key_public';
import { sha256 } from './ecc/src/hash';
import { getConfig } from '../config';
import bs58 from 'bs58';
import { Signature } from './ecc/src/signature';
import { transaction, signed_transaction } from './serializer';

export interface KeyPair {
    privateKey: string;
    publicKey: string;
}

export interface KeyPairs {
    [role: string]: KeyPair;
}

export interface Authority {
    key_auths: [string, number][];
}

export interface Auth {
    verify(name: string, password: string, auths: unknown): boolean;
    generateKeys(name: string, password: string, roles: string[]): { [key: string]: string };
    getPrivateKeys(name: string, password: string, roles?: string[]): { [key: string]: string };
    isWif(privWif: string): boolean;
    toWif(name: string, password: string, role: string): string;
    wifIsValid(privWif: string, pubWif: string): boolean;
    wifToPublic(privWif: string): string;
    isPubkey(pubkey: string, address_prefix?: string): boolean;
    signTransaction(trx: unknown, keys: string[]): unknown;
}

export const Auth: Auth = {
    verify(name: string, password: string, auths: unknown): boolean {
        let hasKey = false;
        const authsObj = auths as Record<string, unknown> | null;
        if (!authsObj || typeof authsObj !== 'object') return false;
        const roles = Object.keys(authsObj);
        const pubKeys = this.generateKeys(name, password, roles);
        roles.forEach((role) => {
            const roleAuth = authsObj[role] as unknown;
            if (Array.isArray(roleAuth) && roleAuth.length > 0) {
                const firstAuth = roleAuth[0] as unknown;
                if (Array.isArray(firstAuth) && firstAuth.length > 0 && firstAuth[0] === pubKeys[role]) {
                hasKey = true;
                }
            }
        });
        return hasKey;
    },

    generateKeys(name: string, password: string, roles: string[] = ['owner', 'active', 'posting', 'memo']): { [key: string]: string } {
        const pubKeys: { [key: string]: string } = {};
        roles.forEach((role) => {
            const seed = name + role + password;
            const brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
            const privKey = PrivateKey.fromSeed(brainKey);
            pubKeys[role] = privKey.toPublic().toString();
        });
        return pubKeys;
    },

    getPrivateKeys(name: string, password: string, roles: string[] = ['owner', 'active', 'posting', 'memo']): { [key: string]: string } {
        const privKeys: { [key: string]: string } = {};
        roles.forEach((role) => {
            const seed = name + role + password;
            const brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
            const privKey = PrivateKey.fromSeed(brainKey);
            privKeys[role] = privKey.toWif();
            privKeys[role + 'Pubkey'] = privKey.toPublic().toString();
        });
        return privKeys;
    },

    isWif(privWif: string): boolean {
        let isWif = false;
        try {
            const bufWif = Buffer.from(bs58.decode(privWif));
            // Valid WIF: 1 byte version + 32 bytes key + 4 bytes checksum = 37 bytes
            if (bufWif.length !== 37) {
                return false;
            }
            const privKey = bufWif.slice(0, -4);
            const checksum = bufWif.slice(-4);
            let newChecksum = sha256(privKey);
            newChecksum = sha256(newChecksum);
            newChecksum = newChecksum.slice(0, 4);
            if (checksum.toString() === newChecksum.toString()) {
                isWif = true;
            }
        } catch {
            // Ignore errors
        }
        return isWif;
    },

    toWif(name: string, password: string, role: string): string {
        const seed = name + role + password;
        const brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
        const hashSha256 = sha256(Buffer.from(brainKey));
        const privKey = Buffer.concat([Buffer.from([0x80]), hashSha256]);
        let checksum = sha256(privKey);
        checksum = sha256(checksum);
        checksum = checksum.slice(0, 4);
        const privWif = Buffer.concat([privKey, checksum]);
        return bs58.encode(privWif);
    },

    wifIsValid(privWif: string, pubWif: string): boolean {
        return (this.wifToPublic(privWif) === pubWif);
    },

    wifToPublic(privWif: string): string {
        const pubWif = PrivateKey.fromWif(privWif);
        return pubWif.toPublic().toString();
    },

    isPubkey(pubkey: string, address_prefix?: string): boolean {
        try {
            return PublicKey.fromString(pubkey, address_prefix) !== null;
        } catch {
            return false;
        }
    },

    signTransaction(trx: unknown, keys: string[]): unknown {
        if (!Array.isArray(keys)) {
            throw new Error('Keys must be an array');
        }
        
        const signatures: string[] = [];
        const trxObjWithSigs = trx as { signatures?: unknown[] };
        if (Array.isArray(trxObjWithSigs.signatures)) {
            signatures.push(...trxObjWithSigs.signatures.map((sig: unknown) => 
                Buffer.isBuffer(sig) ? sig.toString('hex') : String(sig)
            ));
        }

        const chainId = (getConfig().get('chain_id') as string | undefined) || '';
        const cid = Buffer.from(chainId, 'hex');
        const buf = transaction.toBuffer(trx as unknown);

        for (const key of keys) {
            const sig = Signature.signBuffer(Buffer.concat([cid, buf]), key);
            // Use toBuffer() to match old-steem-js behavior
            // The serializer will convert Buffer to hex string when needed
            signatures.push(sig.toBuffer().toString('hex'));
        }

        const trxObj = trx as Record<string, unknown>;
        return signed_transaction.toObject(Object.assign(trxObj, { signatures }));
    }
};

export default Auth;

// Export individual functions
export const verify = Auth.verify.bind(Auth);
export const generateKeys = Auth.generateKeys.bind(Auth);
export const getPrivateKeys = Auth.getPrivateKeys.bind(Auth);
export const isWif = Auth.isWif.bind(Auth);
export const toWif = Auth.toWif.bind(Auth);
export const wifIsValid = Auth.wifIsValid.bind(Auth);
export const wifToPublic = Auth.wifToPublic.bind(Auth);
export const isPubkey = Auth.isPubkey.bind(Auth);

// Export classes
export { PrivateKey } from './ecc/src/key_private';
export { PublicKey } from './ecc/src/key_public';
export { Signature } from './ecc/src/signature';
export { Address } from './ecc/src/address';

// Export crypto functions
export const sign = (message: string, privateKey: string): string => {
    const priv = PrivateKey.fromWif(privateKey);
    const sig = Signature.signBuffer(Buffer.from(message), priv);
    return sig.toHex();
};

export const verifySignature = (message: string, signature: string, publicKey: string): boolean => {
    try {
        const pub = PublicKey.fromString(publicKey);
        if (!pub) return false;
        const sigObj = Signature.fromHex(signature);
        return sigObj.verifyBuffer(Buffer.from(message), pub);
    } catch {
        return false;
    }
};

export const verifyTransaction = (transaction: unknown, publicKey: string): boolean => {
    try {
        const pub = PublicKey.fromString(publicKey);
        if (!pub) return false;
        const serialized = Buffer.from(JSON.stringify(transaction));
        const trx = transaction as { signatures?: string[] };
        if (!trx.signatures || !Array.isArray(trx.signatures)) return false;
        return trx.signatures.some((sig: string) => {
            const signature = Signature.fromHex(sig);
            return signature.verifyBuffer(serialized, pub);
        });
    } catch {
        return false;
    }
};

// Add missing exports
export const getPublicKey = (privateKey: string): string => {
    const priv = PrivateKey.fromWif(privateKey);
    return priv.toPublic().toString();
};

export const getPrivateKey = (seed: string): string => {
    const brainKey = seed.trim().split(/[\t\n\v\f\r ]+/).join(' ');
    const hashSha256 = sha256(Buffer.from(brainKey));
    const privKey = Buffer.concat([Buffer.from([0x80]), hashSha256]);
    let checksum = sha256(privKey);
    checksum = sha256(checksum);
    checksum = checksum.slice(0, 4);
    const privWif = Buffer.concat([privKey, checksum]);
    return bs58.encode(privWif);
};

// Add stub for test compatibility
export const signTransaction = Auth.signTransaction.bind(Auth); 