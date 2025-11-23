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
    verify(name: string, password: string, auths: any): boolean;
    generateKeys(name: string, password: string, roles: string[]): { [key: string]: string };
    getPrivateKeys(name: string, password: string, roles?: string[]): { [key: string]: string };
    isWif(privWif: string): boolean;
    toWif(name: string, password: string, role: string): string;
    wifIsValid(privWif: string, pubWif: string): boolean;
    wifToPublic(privWif: string): string;
    isPubkey(pubkey: string, address_prefix?: string): boolean;
    signTransaction(trx: any, keys: string[]): any;
}

export const Auth: Auth = {
    verify(name: string, password: string, auths: any): boolean {
        let hasKey = false;
        const roles = Object.keys(auths);
        const pubKeys = this.generateKeys(name, password, roles);
        roles.forEach((role) => {
            if (auths[role][0][0] === pubKeys[role]) {
                hasKey = true;
            }
        });
        return hasKey;
    },

    generateKeys(name: string, password: string, roles: string[] = ['owner', 'active', 'posting', 'memo']): { [key: string]: string } {
        const pubKeys: { [key: string]: string } = {};
        roles.forEach((role) => {
            const seed = name + role + password;
            const brainKey = seed.trim().split(/[	\n\v\f\r ]+/).join(' ');
            const privKey = PrivateKey.fromSeed(brainKey);
            pubKeys[role] = privKey.toPublic().toString();
        });
        return pubKeys;
    },

    getPrivateKeys(name: string, password: string, roles: string[] = ['owner', 'active', 'posting', 'memo']): { [key: string]: string } {
        const privKeys: { [key: string]: string } = {};
        roles.forEach((role) => {
            const seed = name + role + password;
            const brainKey = seed.trim().split(/[	\n\v\f\r ]+/).join(' ');
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
            const privKey = bufWif.slice(0, -4);
            const checksum = bufWif.slice(-4);
            let newChecksum = sha256(privKey);
            newChecksum = sha256(newChecksum);
            newChecksum = newChecksum.slice(0, 4);
            if (checksum.toString() === newChecksum.toString()) {
                isWif = true;
            }
        } catch (e) { }
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

    signTransaction(trx: any, keys: string[]): any {
        if (!Array.isArray(keys)) {
            throw new Error('Keys must be an array');
        }
        
        const signatures: Buffer[] = [];
        if (trx.signatures) {
            signatures.push(...trx.signatures.map((sig: any) => Buffer.from(sig)));
        }

        const cid = Buffer.from(getConfig().get('chain_id') || '', 'hex');
        const buf = transaction.toBuffer(trx);

        for (const key of keys) {
            const sig = Signature.signBuffer(Buffer.concat([cid, buf]), key);
            signatures.push(sig.toBuffer());
        }

        return signed_transaction.toObject(Object.assign(trx, { signatures }));
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

export const verifyTransaction = (transaction: any, publicKey: string): boolean => {
    try {
        const pub = PublicKey.fromString(publicKey);
        if (!pub) return false;
        const serialized = Buffer.from(JSON.stringify(transaction));
        return transaction.signatures.some((sig: string) => {
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