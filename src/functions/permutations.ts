import { ForeignKeyStructure } from 'src/database/structures';

export function select2(array: [any]) {
  const res = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = i + 1; j < array.length; j++) {
      res.push([array[i], array[j]]);
    }
  }
  return res;
}

export function selectN(n: number, array: any[]) {
  // return array;
  let res = [];
  res = doLoop(array, 0, n);

  return res;
}

function doLoop(array: any[], start: number, n: number, level: number = 1): any {
  const res = [];
  for (let i = start; i < array.length; i++) {
    if (level === n) {
      res.push([array[i]]);
    } else {
      const r = doLoop(array, i + 1, n, level + 1);
      for (const item of r) {
        res.push([array[i], ...item]);
      }
    }
  }
  return res;
}

export function permutations(array: any[], level: number = 0): any {
  if (level === array.length - 1) {
    return array[level].map((item: any) => [item]);
  }
  const p = permutations(array, level + 1);
  const res = [];
  for (let i = 0; i < array[level].length; i++) {
    const a = array[level][i];
    for (let j = 0; j < p.length; j++) {
      res.push([a, ...p[j]]);
    }
  }
  return res;
}

export function removeDoubles(array: any[]) {
  return array.filter((a) => new Set(a.map((item: any) => item.columnName)).size === a.length);
}

export function testLikness(one: any, two: any) {
  if (one.length !== two.length) {
    return 0;
  }
  let sum = 0;
  for (const key in one) {
    const word2 = one[key];
    const word1 = two[key];
    // test if the strings are the same.
    sum += distance(word1, word2);
    sum += distance(word2, word1);
  }
  return (sum / one.length) * 0.5;
}
const adjustments = {
  // A: "E"
  // A: "I",
  // A: "O",
  // A: "U",
  // B: "V",
  // E: "I",
  // E: "O",
  // E: "U",
  // I: "O",
  // I: "U",
  // O: "U",
  // I: "Y",
  // E: "Y",
  // C: "G",
  // E: "F",
  // W: "U",
  // W: "V",
  // X: "K",
  // S: "Z",
  // X: "S",
  // Q: "C",
  // U: "V",
  // M: "N",
  // L: "I",
  // Q: "O",
  // P: "R",
  // I: "J",
  // "2": "Z",
  // "5": "S",
  // "8": "B",
  // "1": "I",
  // "1": "L",
  // "0": "O",
  // "0": "Q",
  // C: "K",
  // G: "J",
  // E: " ",
  // Y: " ",
  // S: " "
};
function distance(a: string, b: string) {
  if (!a || !b) {
    return 0.0;
  }

  a = a.trim().toUpperCase();
  b = b.trim().toUpperCase();
  const a_len = a.length;
  const b_len = b.length;
  const a_flag = [];
  const b_flag = [];
  const search_range = Math.floor(Math.max(a_len, b_len) / 2) - 1;
  const minv = Math.min(a_len, b_len);

  // Looking only within the search range, count and flag the matched pairs.
  let Num_com = 0;
  const yl1 = b_len - 1;
  for (var i: number = 0; i < a_len; i++) {
    const lowlim = i >= search_range ? i - search_range : 0;
    const hilim = i + search_range <= yl1 ? i + search_range : yl1;
    for (var j = lowlim; j <= hilim; j++) {
      if (b_flag[j] !== 1 && a[j] === b[i]) {
        a_flag[j] = 1;
        b_flag[i] = 1;
        Num_com++;
        break;
      }
    }
  }

  // Return if no characters in common
  if (Num_com === 0) {
    return 0.0;
  }

  // Count the number of transpositions
  let k = 0;
  let N_trans = 0;
  for (var i = 0; i < a_len; i++) {
    if (a_flag[i] === 1) {
      var j: number;
      for (j = k; j < b_len; j++) {
        if (b_flag[j] === 1) {
          k = j + 1;
          break;
        }
      }
      if (a[i] !== b[j]) {
        N_trans++;
      }
    }
  }
  N_trans = Math.floor(N_trans / 2);

  // Adjust for similarities in nonmatched characters
  let N_simi = 0;
  const adjwt: any = adjustments;
  if (minv > Num_com) {
    for (var i = 0; i < a_len; i++) {
      if (!a_flag[i]) {
        for (var j = 0; j < b_len; j++) {
          if (!b_flag[j]) {
            if (adjwt[a[i]] === b[j]) {
              N_simi += 3;
              b_flag[j] = 2;
              break;
            }
          }
        }
      }
    }
  }

  const Num_sim = N_simi / 10.0 + Num_com;

  // Main weight computation
  let weight = Num_sim / a_len + Num_sim / b_len + (Num_com - N_trans) / Num_com;
  weight /= 3;

  // Continue to boost the weight if the strings are similar
  if (weight > 0.7) {
    // Adjust for having up to the first 4 characters in common
    var j = minv >= 4 ? 4 : minv;
    var i: number;
    for (i = 0; i < j && a[i] === b[i]; i++) {}
    if (i) {
      weight += i * 0.1 * (1.0 - weight);
    }

    // Adjust for long strings.
    // After agreeing beginning chars, at least two more must agree
    // and the agreeing characters must be more than half of the
    // remaining characters.
    if (minv > 4 && Num_com > i + 1 && 2 * Num_com >= minv + i) {
      weight
        += (1 - weight) * ((Num_com - i - 1) / (a_len * b_len - i * 2 + 2));
    }
  }

  return weight;
}

export function testKeyLikeliness(key: ForeignKeyStructure, likelinessThreshold: number) {
  if (likelinessThreshold === 0) {
    return true;
  }
  return testLikness(
    key.columns.map((item) => item.pkColumn),
    key.columns.map((item) => item.fkColumn),
  ) > likelinessThreshold;
}
