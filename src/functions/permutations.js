export function select2(array) {
  let res = [];
  for (var i = 0; i < array.length; i++) {
    for (var j = i + 1; j < array.length; j++) {
      res.push([array[i], array[j]]);
    }
  }
  return res;
}

export function selectN(n, array) {
  // return array;
  let res = [];
  res = doLoop(array, 0, n);
  // for (var i = 0; i < array.length; i++) {
  //   for (var j = i + 1; j < array.length; j++) {
  //     res.push([array[i], array[j]]);
  //   }
  // }
  return res;
}

function doLoop(array, start, n, level = 1) {
  // console.log(n, level);
  // if (level > n) {
  //   return [];
  // }
  var res = [];
  for (var i = start; i < array.length; i++) {
    if (level === n) {
      res.push([array[i]]);
    } else {
      var r = doLoop(array, i + 1, n, level + 1);
      // console.log("r:", r);
      for (var key in r) {
        let item = r[key];
        res.push([array[i], ...item]);
      }
    }
  }
  // console.log(res);
  return res;
}

// console.log(select(4, array));
// console.log(select2(array));
//
// if (select2(array).length === select(2, array).length) {
//   console.log("equal");
// } else {
//   console.log("not equal");
// }

export function permutations(array, level = 0) {
  if (level === array.length - 1) {
    return array[level].map(item => {
      return [item];
    });
  }
  let p = permutations(array, level + 1);
  let res = [];
  for (let i = 0; i < array[level].length; i++) {
    let a = array[level][i];
    for (let j = 0; j < p.length; j++) {
      res.push([a, ...p[j]]);
    }
  }
  return res;
}

export function removeDoubles(array) {
  return array.filter(a => {
    return new Set(a.map(item => item.columnName)).size === a.length;
  });
}

// console.log(permutations([[1, 2, 3], [4, 5, 6], [7, 8, 9]]));

export function testLikness(one, two) {
  // console.log(one, two);
  if (one.length !== two.length) {
    return 0;
  }
  let sum = 0;
  for (let key in one) {
    let word2 = one[key];
    let word1 = two[key];
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
function distance(a, b) {
  if (!a || !b) {
    return 0.0;
  }

  a = a.trim().toUpperCase();
  b = b.trim().toUpperCase();
  var a_len = a.length;
  var b_len = b.length;
  var a_flag = [];
  var b_flag = [];
  var search_range = Math.floor(Math.max(a_len, b_len) / 2) - 1;
  var minv = Math.min(a_len, b_len);
  // console.log(minv);

  // Looking only within the search range, count and flag the matched pairs.
  var Num_com = 0;
  var yl1 = b_len - 1;
  for (var i = 0; i < a_len; i++) {
    var lowlim = i >= search_range ? i - search_range : 0;
    var hilim = i + search_range <= yl1 ? i + search_range : yl1;
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
  var k = 0;
  var N_trans = 0;
  for (var i = 0; i < a_len; i++) {
    if (a_flag[i] === 1) {
      var j;
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
  var N_simi = 0;
  var adjwt = adjustments;
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

  var Num_sim = N_simi / 10.0 + Num_com;

  // Main weight computation
  var weight =
    Num_sim / a_len + Num_sim / b_len + (Num_com - N_trans) / Num_com;
  weight = weight / 3;

  // Continue to boost the weight if the strings are similar
  if (weight > 0.7) {
    // Adjust for having up to the first 4 characters in common
    var j = minv >= 4 ? 4 : minv;
    var i;
    for (i = 0; i < j && a[i] === b[i]; i++) {}
    if (i) {
      weight += i * 0.1 * (1.0 - weight);
    }

    // Adjust for long strings.
    // After agreeing beginning chars, at least two more must agree
    // and the agreeing characters must be more than half of the
    // remaining characters.
    if (minv > 4 && Num_com > i + 1 && 2 * Num_com >= minv + i) {
      weight +=
        (1 - weight) * ((Num_com - i - 1) / (a_len * b_len - i * 2 + 2));
    }
  }

  return weight;
}
// console.log(testLikness(["hello"], ["word"]));

// console.log(
//   testLikness(
//     ["DOKUMENT_FK_ID", "INITARENDE_JN", "HISTORIK_JN"],
//     ["DOKUMENTDOC_FK_ID", "INTERNET_JN", "INTRANET_JN"]
//   )
// );
// console.log(
//   testLikness(
//     ["DOKUMENTDOC_FK_ID", "INTERNET_JN", "INTRANET_JN"],
//     ["DOKUMENT_FK_ID", "INITARENDE_JN", "HISTORIK_JN"]
//   )
// );

// console.log(testLikness(["HISTORIK_JN"], ["INTRANET_JN"]));
// console.log(testLikness(["INTRANET_JN"], ["HISTORIK_JN"]));
