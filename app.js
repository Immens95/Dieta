fetch('data.json')
  .then(res => res.json())
  .then(data => initForms(data.people));

function initForms(people) {
  Object.keys(people).forEach(key => {
    const personData = people[key];
    const section = document.getElementById(key);
    const form = section.querySelector('form');

    Object.keys(personData).forEach(field => {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) {
        input.value = personData[field];

        input.addEventListener('input', () => {
          personData[field] = input.value;
          console.log('Aggiornato', key, personData);
        });
      }
    });
  });
}
