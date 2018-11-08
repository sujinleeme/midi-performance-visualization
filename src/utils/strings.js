// @flow

const camelCaseIt = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .split(/[.\-_\s]/g)
    .reduce((string, word) => string + word[0].toUpperCase() + word.slice(1));

export default { camelCaseIt };
