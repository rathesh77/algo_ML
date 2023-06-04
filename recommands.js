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
  const films = Object.keys(c1);
  const filmsC2 = Object.keys(c2);
  let dist = 0;
  for (const film of films) {
    if (film in filmsC2) {
      dist += (c1[film] - c2[film]) ** 2;
    }
  }
  return 1 / (1 + Math.sqrt(dist));
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

  let sum_x_s_squared = uniqs.reduce((acc, val) => acc + c1[val] ** 2, 0);
  let sum_y_s_squared = uniqs.reduce((acc, val) => acc + c2[val] ** 2, 0);

  for (const film of uniqs) {
    const x = c1[film];
    const y = c2[film];
    const product = x * y;
    sum_x_mult_y += product;
  }

  return (
    (uniqs.length * sum_x_mult_y - xs * ys) /
    Math.sqrt(
      (uniqs.length * sum_x_s_squared - xs ** 2) *
        (uniqs.length * sum_y_s_squared - ys ** 2)
    )
  );
}

function recommandation(toby) {
  let similarities = {};

  const films = Array.from(
    new Set(
      Object.keys(critics)
        .map((p) => critics[p])
        .map((f) => Object.keys(f))
        .reduce((a, v) => a.concat(v), [])
    )
  ).filter((f) => !critics[toby][f]);
  let persons = [];
  for (const person of Object.keys(critics)) {
    if (
      Object.keys(critics[person]).filter((f) => films.find((e) => e == f))
        .length > 0
    ) {
      persons.push(person);
    }
  }

  for (const p of persons) {
    similarities[p] = pearson_correlation(critics[toby], critics[p]);
  }
  let sims = [];
  for (const person of Object.keys(similarities)) {
    sims.push([person, similarities[person]]);
  }

  sims = sims.sort(function (a, b) {
    return b[1] - a[1];
  });

  sims = sims.slice(0, 5);
  similarities = {};
  for (let i = 0; i < sims.length; i++) {
    similarities[sims[i][0]] = sims[i][1];
  }
  persons = Object.keys(similarities);

  const results = [];
  for (const film of films) {
    let s_dot_film_total = 0;

    for (const person of persons) {
      const s_dot_film = similarities[person] * critics[person][film];
      if (critics[person][film] == null) continue;
      s_dot_film_total += s_dot_film;
    }
    let sim_dot_sum = 0;
    for (const p of Object.keys(similarities)) {
      if (critics[p][film] == null) continue;

      sim_dot_sum += similarities[p];
    }

    const total_sim_sum = s_dot_film_total / sim_dot_sum;
    results.push([film, total_sim_sum]);
  }

  return results.sort((a, b) => b[1] - a[1])[0];
}

//console.log(euclidian_distance(critics["Lisa Rose"], critics["Gene Seymour"]));
//console.log(euclidian_distance(critics["Lisa Rose"], critics["Michael Phillips"]));

//console.log(pearson_correlation(critics["Lisa Rose"], critics["Gene Seymour"]));
//console.log(pearson_correlation(critics["Lisa Rose"], critics["Michael Phillips"]));

console.log(recommandation("Michael Phillips"));
