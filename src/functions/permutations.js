let array = ["apple", "banana", "pear", "lemon", "orange"];

function select2(array) {
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
