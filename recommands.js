const critics = {
  "Lisa Rose": {
    "Lady in the Water": 2.5,
    "Snakes on a Plane": 3.5,
    "Just My Luck": 3.0,
    "Superman Returns": 3.5,
    "You, Me and Dupree": 2.5,
    "The Night Listener": 3.0,
  },

  "Gene Seymour": {
    "Lady in the Water": 3.0,
    "Snakes on a Plane": 3.5,
    "Just My Luck": 1.5,
    "Superman Returns": 5.0,
    "The Night Listener": 3.0,
    "You, Me and Dupree": 3.5,
  },

  "Michael Phillips": {
    "Lady in the Water": 2.5,
    "Snakes on a Plane": 3.0,
    "Superman Returns": 3.5,
    "The Night Listener": 4.0,
  },

  "Claudia Puig": {
    "Snakes on a Plane": 3.5,
    "Just My Luck": 3.0,
    "The Night Listener": 4.5,
    "Superman Returns": 4.0,
    "You, Me and Dupree": 2.5,
  },

  "Mick LaSalle": {
    "Lady in the Water": 3.0,
    "Snakes on a Plane": 4.0,
    "Just My Luck": 2.0,
    "Superman Returns": 3.0,
    "The Night Listener": 3.0,
    "You, Me and Dupree": 2.0,
  },

  "Jack Matthews": {
    "Lady in the Water": 3.0,
    "Snakes on a Plane": 4.0,
    "The Night Listener": 3.0,
    "Superman Returns": 5.0,
    "You, Me and Dupree": 3.5,
  },

  Toby: {
    "Snakes on a Plane": 4.5,
    "You, Me and Dupree": 1.0,
    "Superman Returns": 4.0,
  },
};

function euclidian_distance(c1, c2) {
  const c1Films = Object.keys(c1);
  const c2Films = Object.keys(c2);

  const films = Array.from(new Set([...c1Films, ...c2Films]));
  const uniqs = [];

  for (const film of films) {
    if (!c1[film] || !c2[film]) {
      continue;
    }
    uniqs.push(film);
  }

  const distances = [];
  for (let i = 0; i < uniqs.length; i++) {
    for (let j = i + 1; j < uniqs.length; j++) {
      
      const x1 = c1[uniqs[i]];
      const y1 = c1[uniqs[j]];

      const x2 = c2[uniqs[i]];
      const y2 = c2[uniqs[j]];

      const dist = Math.sqrt(
        Math.abs((x2 - x1) ** 2) + Math.abs((y2 - y1) ** 2)
      );
      const normalized = 1 / (1 + dist);
      distances.push(normalized);
    }
  }
  let mean = distances.reduce((acc, val) => acc + val, 0) / distances.length;
  return mean;
}

function pearson_correlation(c1, c2) {
  const c1Films = Object.keys(c1);
  const c2Films = Object.keys(c2);

  const films = Array.from(new Set([...c1Films, ...c2Films]));
  const uniqs = [];

  for (const film of films) {
    if (!c1[film] || !c2[film]) {
      continue;
    }
    uniqs.push(film);
  }

  const xs = uniqs.reduce((acc, val) => acc + c1[val], 0);
  const ys = uniqs.reduce((acc, val) => acc + c2[val], 0);

  let sum_x_mult_y = 0;

  let sum_x_s_squared = uniqs.reduce((acc, val) => acc + (c1[val] ** 2), 0);
  let sum_y_s_squared = uniqs.reduce((acc, val) => acc + (c2[val] ** 2), 0);

  for (const film of uniqs) {
    const x = c1[film];
    const y = c2[film];
    const product = x * y;
    sum_x_mult_y += product;
  }

  return (
    ((uniqs.length * sum_x_mult_y) - (xs * ys)) /
    Math.sqrt(
      ((uniqs.length * sum_x_s_squared) - (xs ** 2)) *
        ((uniqs.length * sum_y_s_squared) - (ys ** 2))
    )
  );
}

console.log(euclidian_distance(critics["Lisa Rose"], critics["Michael Phillips"]));
console.log(euclidian_distance(critics["Lisa Rose"], critics["Gene Seymour"]));

console.log(pearson_correlation(critics["Lisa Rose"], critics["Michael Phillips"]));
console.log(pearson_correlation(critics["Lisa Rose"], critics["Gene Seymour"]));
