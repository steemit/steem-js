export interface TransferOperation {
  0: 'transfer';
  1: {
    from: string;
    to: string;
    amount: string;
    memo: string;
  };
}

export interface VoteOperation {
  0: 'vote';
  1: {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
  };
}

export interface CommentOperation {
  0: 'comment';
  1: {
    parent_author: string;
    parent_permlink: string;
    author: string;
    permlink: string;
    title: string;
    body: string;
    json_metadata: string;
  };
}

export interface CustomJsonOperation {
  0: 'custom_json';
  1: {
    required_auths: string[];
    required_posting_auths: string[];
    id: string;
    json: string;
  };
}

export type Operation = 
  | TransferOperation
  | VoteOperation
  | CommentOperation
  | CustomJsonOperation;

export const createTransfer = (
  from: string,
  to: string,
  amount: string,
  memo: string = ''
): TransferOperation => ({
  0: 'transfer',
  1: {
    from,
    to,
    amount,
    memo
  }
});

export const createVote = (
  voter: string,
  author: string,
  permlink: string,
  weight: number
): VoteOperation => ({
  0: 'vote',
  1: {
    voter,
    author,
    permlink,
    weight
  }
});

export const createComment = (
  parentAuthor: string,
  parentPermlink: string,
  author: string,
  permlink: string,
  title: string,
  body: string,
  jsonMetadata: string = '{}'
): CommentOperation => ({
  0: 'comment',
  1: {
    parent_author: parentAuthor,
    parent_permlink: parentPermlink,
    author,
    permlink,
    title,
    body,
    json_metadata: jsonMetadata
  }
});

export const createCustomJson = (
  requiredAuths: string[],
  requiredPostingAuths: string[],
  id: string,
  json: string
): CustomJsonOperation => ({
  0: 'custom_json',
  1: {
    required_auths: requiredAuths,
    required_posting_auths: requiredPostingAuths,
    id,
    json
  }
}); 