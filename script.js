'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const alertError = document.getElementById('alert-error');
const clearWorkout = document.querySelector('.clearworkout');
const workoutDelete = document.querySelector('.workout__delete');
const workoutEdit = document.querySelector('.workout__edit');
// console.log(name);
// let map;
// let mapEvent;
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  click = 0;
  edit = ' ✏️ ';
  deleteIcon = ' 🗑️';
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDiscription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  clicks() {
    this.click++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDiscription();
    // this._setEdit();
    // this._setDelete();
  }
  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDiscription();
    // this._setEdit();
    // this._setDelete();
  }
  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cycling1);
// console.log(run1.calcPace());

class App {
  #map;
  #mapSoomToView = 13;
  #mapEvent;
  #workout = [];
  constructor() {
    //User's Position
    this._getPosition();

    // Get Localstorage
    this._getLocalStorage();

    // Attach Event Handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
    clearWorkout.addEventListener('click', this._reset.bind(this));
    // workoutDelete.addEventListener('click', this._deleteWorkout.bind(this));
    // workoutEdit.addEventListener('click', this._editWorkout.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this._handleWorkoutClick.bind(this),
    );
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Unable to get your Location');
        },
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapSoomToView);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    form.style.display = 'none';
    form.classList.add('hidden');
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const checkPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault(); // Prevent default form submission
    let lat, lng;

    if (!this.editingWorkoutId) {
      ({ lat, lng } = this.#mapEvent.latlng);
    }
    const type = inputType.value; // Get workout type
    const distance = +inputDistance.value; // Parse distance
    const duration = +inputDuration.value; // Parse duration
    let workout;

    // Check if input are valid
    // if workout running,create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadence) ||
        !checkPositive(distance, duration, cadence)
      ) {
        const checkAlert = () => {
          alertError.textContent = 'Input have to be Positive numbers';
          alertError.classList.add('show');
          console.log('james');

          setTimeout(() => {
            alertError.classList.remove('show');
          }, 3000);
        };
        checkAlert();
        return;
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if workout cyclig,create cycling object
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevationGain) ||
        !checkPositive(distance, duration)
      ) {
        const checkAlert = () => {
          alertError.textContent = 'Input have to be Positive numbers';
          alertError.classList.add('show');
          console.log('james');
        };
        checkAlert();
        return;
      }
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // Check if editing an existing workout
    if (this.editingWorkoutId) {
      // Find the existing workout by its ID
      workout = this.#workout.find(w => w.id === this.editingWorkoutId);
      if (!workout) return; // Exit if not found

      // Update properties
      workout.distance = distance;
      workout.duration = duration;

      if (type === 'running') {
        workout.cadence = +inputCadence.value; // Parse cadence
        workout.calcPace(); // Update pace calculation
      } else if (type === 'cycling') {
        workout.elevationGain = +inputElevation.value; // Parse elevation gain
        workout.calcSpeed(); // Update speed calculation
      }

      workout._setDiscription(); // Update the description after changes
      this._updateWorkoutMarker(workout); // Update the corresponding map marker

      // Remove old UI
      document.querySelector(`.workout[data-id="${workout.id}"]`).remove();

      // Render updated workout
      this._renderWorkout(workout);

      // Clear state and local storage
      this._setLocalStorage();
      this.editingWorkoutId = null; // Reset the editing ID
      this._hideForm(); // Hide the form
      return; // Exit to prevent creating a new workout
    }

    // Logic for creating a new workout...
    if (type === 'running') {
      const cadence = +inputCadence.value;
      workout = new Running([lat, lng], distance, duration, cadence);
    } else if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    this.#workout.push(workout); // Add new workout to the array
    this._renderWorkoutMarker(workout); // Render marker on the map
    this._renderWorkout(workout); // Render workout in the UI

    // Clear input fields
    this._hideForm();
    this._setLocalStorage(); // Save workouts to local storage
  }

  _updateWorkoutMarker(workout) {
    // Remove the existing marker first
    if (workout.marker) {
      this.#map.removeLayer(workout.marker);
    }

    // Create and store a new marker
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }),
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`,
      )
      .openPopup();

    workout.marker = marker; // Store the new marker reference in the workout object
  }

  _renderWorkoutMarker(workout) {
    const marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }),
      )
      .setPopupContent(
        `${workout.type == 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`,
      )
      .openPopup();
    // Store marker reference in workout object
    workout.marker = marker;
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description} </h2>
          <span class="workout__edit" data-id="${workout.id}">✏️</span>
          <span class="workout__delete" data-id="${workout.id}">🗑️</span>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
      </div>
      </li>
      `;
    }

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopUp(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id,
    );

    if (!workout) return; //  ADD THIS LINE

    this.#map.setView(workout.coords, this.#mapSoomToView, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _handleWorkoutClick(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return; // Ensure it's a workout element

    if (e.target.classList.contains('workout__edit')) {
      this._editWorkout(workoutEl.dataset.id); // Call edit function
    }

    if (e.target.classList.contains('workout__delete')) {
      this._deleteWorkout(workoutEl.dataset.id); // Call delete function
    }

    this._moveToPopUp(e); // Keep the existing functionality to show the popup on map click
  }

  _editWorkout(id) {
    const workout = this.#workout.find(work => work.id === id);
    if (!workout) return; // If no workout found, exit

    // Set form fields to the current workout data
    inputType.value = workout.type;
    inputDistance.value = workout.distance;
    inputDuration.value = workout.duration;

    // Reset both fields to be visible
    inputCadence.closest('.form__row').classList.remove('form__row--hidden');
    inputElevation.closest('.form__row').classList.remove('form__row--hidden');

    if (workout.type === 'running') {
      inputCadence.value = workout.cadence; // Load current cadence
      inputElevation.closest('.form__row').classList.add('form__row--hidden'); // Hide elevation input
    } else if (workout.type === 'cycling') {
      inputElevation.value = workout.elevationGain; // Load current elevation gain
      inputCadence.closest('.form__row').classList.add('form__row--hidden'); // Hide cadence input
    }

    this.editingWorkoutId = id; // Set the ID for editing
    form.classList.remove('hidden'); // Show the form
  }

  _deleteWorkout(id) {
    const workout = this.#workout.find(work => work.id === id);
    if (!workout) return;

    //Remove marker from map
    if (workout.marker) {
      this.#map.removeLayer(workout.marker);
    }

    // Remove from array
    this.#workout = this.#workout.filter(work => work.id !== id);

    // Remove from UI
    document.querySelector(`.workout[data-id="${id}"]`).remove();

    // Update storage
    this._setLocalStorage();
  }

  _setLocalStorage() {
    const workouts = this.#workout.map(work => {
      const { marker, ...rest } = work;
      return rest;
    });
    localStorage.setItem('workout', JSON.stringify(workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));

    if (!data) return;

    this.#workout = data.map(work => {
      if (work.type === 'running') {
        return new Running(
          work.coords,
          work.distance,
          work.duration,
          work.cadence,
        );
      }

      if (work.type === 'cycling') {
        return new Cycling(
          work.coords,
          work.distance,
          work.duration,
          work.elevationGain,
        );
      }
    });

    this.#workout.forEach(work => this._renderWorkout(work));
  }
  // Claer all workout
  _reset() {
    localStorage.removeItem('workout');
    location.reload();
  }
}
const app = new App();
