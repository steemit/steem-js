const snakeCaseRe = /_([a-z])/g;
export function camelCase(str) {
  return str.replace(snakeCaseRe, function(_m, l) {
    return l.toUpperCase();
  });
}

export function validateAccountName(value) {
  let i, label, len, suffix;

  suffix = "Account name should ";
  if (!value) {
    return suffix + "not be empty.";
  }
  const length = value.length;
  if (length < 3) {
    return suffix + "be longer.";
  }
  if (length > 16) {
    return suffix + "be shorter.";
  }
  if (/\./.test(value)) {
    suffix = "Each account segment should ";
  }
  const ref = value.split(".");
  for (i = 0, len = ref.length; i < len; i++) {
    label = ref[i];
    if (!/^[a-z]/.test(label)) {
      return suffix + "start with a letter.";
    }
    if (!/^[a-z0-9-]*$/.test(label)) {
      return suffix + "have only letters, digits, or dashes.";
    }
    if (/--/.test(label)) {
      return suffix + "have only one dash in a row.";
    }
    if (!/[a-z0-9]$/.test(label)) {
      return suffix + "end with a letter or digit.";
    }
    if (!(label.length >= 3)) {
      return suffix + "be longer";
    }
  }
  return null;
}
