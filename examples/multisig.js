const steem = require('../lib');

const privWif1 = '5K2LA2ucS8b1GuFvVgZK6itKNE6fFMbDMX4GDtNHiczJESLGRd8';
const privWif2 = '5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg';

steem.broadcast.send({
  extensions: [],
  operations: [
    ['vote', {
      voter: 'sisilafamille',
      author: 'siol',
      permlink: 'test',
      weight: 1000
    }]
  ]}, [privWif1, privWif2], (err, result) => {
  console.log(err, result);
});
