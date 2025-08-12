/* ===== PERSIAPAN AWAL ===== */
// Bagian ini mengambil semua elemen dari HTML agar bisa diubah-ubah isinya nanti.
const cityInput = document.getElementById('cityInput');
const searchButton = document.getElementById('searchButton');
const weatherApp = document.getElementById('weatherApp');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const weatherContent = document.getElementById('weatherContent');
const dailyForecastContainer = document.getElementById('dailyForecast');
const worldWeatherHighlightsContainer = document.getElementById('worldWeatherHighlights');

// Ini adalah alamat "link" ke layanan data cuaca di internet (API).
const geocodingAPI = 'https://geocoding-api.open-meteo.com/v1/search';
const weatherAPI = 'https://api.open-meteo.com/v1/forecast';

// Daftar kota-kota di dunia untuk ditampilkan di bagian samping.
const worldCities = ['Tokyo', 'New York', 'London', 'Paris',
    'Sydney', 'Cairo', 'Moscow', 'Beijing', 'Rio de Janeiro',
    'Singapura', 'Brasilia', 'Washington DC', 'Abu Dhabi',
    'Makkah', 'Madinah', 'Sibolga', 'Medan'];

// Tempat untuk menyimpan data cuaca lengkap setelah diambil dari API.
let fullWeatherData = null;

/* * ===== FUNGSI PENERJEMAH KODE CUACA ===== 
 * API memberikan data cuaca dalam bentuk kode angka (misal: 0, 1, 3).
 * Fungsi ini menerjemahkan kode tersebut menjadi teks yang kita mengerti (Cerah, Berawan)
 * dan menentukan ikon yang sesuai.
*/
function getWeatherInfo(code, isDay = true) {
    const descriptions = {
        0: { desc: "Cerah", icon: isDay ? "sunny" : "clear_night" },
        1: { desc: "Cerah Berawan", icon: isDay ? "partly_cloudy_day" : "partly_cloudy_night" },
        2: { desc: "Berawan", icon: "cloudy" },
        3: { desc: "Sangat Berawan", icon: "cloudy" },
        45: { desc: "Kabut", icon: "foggy" },
        48: { desc: "Kabut Beku", icon: "foggy" },
        51: { desc: "Gerimis Ringan", icon: "rainy_light" },
        61: { desc: "Hujan Ringan", icon: "rainy_light" },
        63: { desc: "Hujan Sedang", icon: "rainy" },
        65: { desc: "Hujan Lebat", icon: "rainy_heavy" },
        71: { desc: "Salju Ringan", icon: "ac_unit" },
        80: { desc: "Badai Petir", icon: "thunderstorm" },
        95: { desc: "Badai Petir", icon: "thunderstorm" },
    };
    return descriptions[code] || { desc: "Tidak Diketahui", icon: "help" };
}

/* * ===== FUNGSI-FUNGSI UNTUK MENGUBAH TAMPILAN (UI) =====
 * Kumpulan fungsi di bawah ini bertugas untuk menampilkan data ke layar,
 * seperti menampilkan info cuaca utama, pesan error, atau prakiraan cuaca.
*/

//fungsi untuk menampilkan pesan error pada saat fetch
function displayError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    weatherContent.style.display = 'none';
    loader.style.display = 'none';
}

// fungsi untuk 
function updateMainDisplay(displayData) {
    document.getElementById('cityName').textContent = displayData.cityName;
    document.getElementById('currentDate').textContent = displayData.date;
    document.getElementById('currentTemp').textContent = `${displayData.temp}°`;
    document.getElementById('currentWeatherDesc').textContent = displayData.weatherDesc;
    const weatherIconContainer = document.getElementById('currentWeatherIcon');
    weatherIconContainer.textContent = '';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined';
    iconSpan.textContent = displayData.weatherIcon;
    weatherIconContainer.appendChild(iconSpan);
    document.getElementById('apparentTemp').textContent = `${displayData.apparentTemp}°`;
    document.getElementById('humidity').textContent = `${displayData.humidity}%`;
    document.getElementById('windSpeed').textContent = `${displayData.windSpeed} km/j`;
    document.getElementById('maxMinTemp').textContent = `${displayData.maxTemp}°/${displayData.minTemp}°`;
    document.getElementById('sunriseTime').textContent = displayData.sunrise;
    document.getElementById('sunsetTime').textContent = displayData.sunset;
}

function updateUI(data, cityName) {
    fullWeatherData = data; // Simpan data mentah dari API.

    // Olah data mentah untuk ditampilkan sebagai cuaca hari ini.
    const todayData = {
        cityName: cityName,
        date: new Date(data.daily.time[0] + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
        temp: Math.round(data.current_weather.temperature),
        weatherDesc: getWeatherInfo(data.current_weather.weathercode, data.current_weather.is_day === 1).desc,
        weatherIcon: getWeatherInfo(data.current_weather.weathercode, data.current_weather.is_day === 1).icon,
        apparentTemp: Math.round(data.hourly.apparent_temperature[data.current_weather.time.slice(-2) - 1]),
        humidity: data.hourly.relativehumidity_2m[data.current_weather.time.slice(-2) - 1], 
        windSpeed: Math.round(data.current_weather.windspeed),
        maxTemp: Math.round(data.daily.temperature_2m_max[0]),
        minTemp: Math.round(data.daily.temperature_2m_min[0]),
        sunrise: new Date(data.daily.sunrise[0]).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
        sunset: new Date(data.daily.sunset[0]).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
    updateMainDisplay(todayData);

    // Buat dan tampilkan prakiraan per jam dan per hari.
    updateHourlyForecast(data.hourly, 0);
    updateDailyForecast(data.daily);

    // Akhirnya, tampilkan semua konten cuaca dan sembunyikan ikon loading.
    weatherContent.style.display = 'block';
    errorMessage.style.display = 'none';
    loader.style.display = 'none';
}



function updateHourlyForecast(hourlyData, dayIndex) {
    const hourlyForecastContainer = document.getElementById('hourlyForecast');
    hourlyForecastContainer.textContent = '';

    const startIndex = dayIndex * 24;
    const endIndex = startIndex + 24;

    for (let i = startIndex; i < endIndex && i < hourlyData.time.length; i++) {
        const time = new Date(hourlyData.time[i]);
        const hour = time.getHours().toString().padStart(2, '0');
        const temp = Math.round(hourlyData.temperature_2m[i]);
        const hourlyWeatherInfo = getWeatherInfo(hourlyData.weathercode[i], hourlyData.is_day[i] === 1);

        const card = document.createElement('div');
        card.className = 'hourlyCard';
        const timeP = document.createElement('p');
        timeP.className = 'time';
        timeP.textContent = `${hour}:00`;
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-outlined icon';
        iconSpan.textContent = hourlyWeatherInfo.icon;
        const tempP = document.createElement('p');
        tempP.className = 'temp';
        tempP.textContent = `${temp}°`;
        card.appendChild(timeP);
        card.appendChild(iconSpan);
        card.appendChild(tempP);
        hourlyForecastContainer.appendChild(card);
    }
}

function updateDailyForecast(dailyData) {
    dailyForecastContainer.textContent = '';
    for (let i = 0; i < 7; i++) {
        const dayName = i === 0 ? "Hari ini" : new Date(dailyData.time[i] + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long' });
        const tempMax = Math.round(dailyData.temperature_2m_max[i]);
        const tempMin = Math.round(dailyData.temperature_2m_min[i]);
        const dailyWeatherInfo = getWeatherInfo(dailyData.weathercode[i]);
        const card = document.createElement('div');
        card.className = 'dailyCard';
        card.dataset.dayIndex = i;
        if (i === 0) card.classList.add('active');
        const dayP = document.createElement('p');
        dayP.className = 'dayName';
        dayP.textContent = dayName;
        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-symbols-outlined icon';
        iconSpan.textContent = dailyWeatherInfo.icon;
        const tempsP = document.createElement('p');
        tempsP.className = 'temps';
        const highSpan = document.createElement('span');
        highSpan.className = 'high';
        highSpan.textContent = `${tempMax}°`;
        const lowSpan = document.createElement('span');
        lowSpan.className = 'low';
        lowSpan.textContent = `${tempMin}°`;
        tempsP.appendChild(highSpan);
        tempsP.appendChild(document.createTextNode(' / '));
        tempsP.appendChild(lowSpan);
        card.appendChild(dayP);
        card.appendChild(iconSpan);
        card.appendChild(tempsP);
        dailyForecastContainer.appendChild(card);
    }
}

/* * ===== FUNGSI YANG MERESPONS AKSI PENGGUNA =====
 * Fungsi di bawah ini akan berjalan ketika pengguna melakukan suatu aksi,
 * seperti mengklik tombol atau memilih hari.
*/

function handleDayClick(dayIndex) {
    if (!fullWeatherData) return;
    const data = fullWeatherData;
    const selectedDate = new Date(data.daily.time[dayIndex] + 'T00:00:00');

    let representativeHourIndex = dayIndex * 24 + 12;
    if (representativeHourIndex >= data.hourly.time.length) {
        representativeHourIndex = data.hourly.time.length - 1;
    }

    const dayData = {
        cityName: document.getElementById('cityName').textContent,
        date: selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
        temp: Math.round(data.daily.temperature_2m_max[dayIndex]),
        weatherDesc: getWeatherInfo(data.daily.weathercode[dayIndex]).desc,
        weatherIcon: getWeatherInfo(data.daily.weathercode[dayIndex]).icon,
        apparentTemp: Math.round(data.hourly.apparent_temperature[representativeHourIndex]),
        humidity: data.hourly.relativehumidity_2m[representativeHourIndex],
        windSpeed: Math.round(data.hourly.windspeed_10m[representativeHourIndex]),
        maxTemp: Math.round(data.daily.temperature_2m_max[dayIndex]),
        minTemp: Math.round(data.daily.temperature_2m_min[dayIndex]),
        sunrise: new Date(data.daily.sunrise[dayIndex]).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
        sunset: new Date(data.daily.sunset[dayIndex]).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
    updateMainDisplay(dayData);
    updateHourlyForecast(data.hourly, dayIndex);

    document.querySelectorAll('.dailyCard').forEach(card => card.classList.remove('active'));
    document.querySelector(`.dailyCard[data-day-index="${dayIndex}"]`).classList.add('active');
}

function handleSearch() {
    const cityName = cityInput.value.trim();
    if (cityName) {
        fetchCoordinates(cityName);
    }
}

/* * ===== FUNGSI UNTUK MENGAMBIL DATA DARI INTERNET (API) =====
 * Pencarian cuaca butuh 2 langkah:
 * 1. `fetchCoordinates`: Mengubah nama kota menjadi koordinat (latitude, longitude).
 * 2. `fetchWeatherData`: Menggunakan koordinat untuk meminta data cuaca lengkap.
*/

// fungsi untuk mengambil data cuaca sesuai dengan koordinat pada parameter
async function fetchWeatherData(latitude, longitude, cityName) {
    const params = new URLSearchParams({ latitude, longitude, current_weather: true, hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,weathercode,is_day,windspeed_10m', daily: 'weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset', timezone: 'auto' });
    try {
        const response = await fetch(`${weatherAPI}?${params}`);
        if (!response.ok) throw new Error('Gagal mengambil data cuaca.');
        const data = await response.json();
        updateUI(data, cityName);
    } catch (error) {
        displayError(error.message);
    }
}

//fungsi untuk mencari koordinat kota yang dicari melalui searchbar
async function fetchCoordinates(cityName) {
    loader.style.display = 'block';
    weatherContent.style.display = 'none';
    errorMessage.style.display = 'none';
    try {
        const response = await fetch(`${geocodingAPI}?name=${encodeURIComponent(cityName)}&count=1&language=id&format=json`);
        if (!response.ok) throw new Error('Layanan geocoding tidak merespon.');
        const data = await response.json();
        if (!data.results || data.results.length === 0) throw new Error(`Kota "${cityName}" tidak ditemukan.`);
        const { latitude, longitude, name } = data.results[0];
        fetchWeatherData(latitude, longitude, name);
    } catch (error) {
        displayError(error.message);
    }
}


/* * ===== FUNGSI UNTUK FITUR "CUACA DUNIA" =====
 * Kode di bawah ini bertanggung jawab untuk mengambil dan menampilkan
 * cuaca ringkas dari berbagai kota di dunia pada panel samping.
*/

// fungsi untuk mengambil data cuaca kota yang koordinatnya seperti yang ada di parameter
async function getSimpleWeatherData(latitude, longitude) {
    const params = new URLSearchParams({ latitude, longitude, current_weather: true, timezone: 'auto' });
    const response = await fetch(`${weatherAPI}?${params}`);
    if (!response.ok) throw new Error('Gagal mengambil data cuaca kota lain.');
    return await response.json();
}

// fungsi untuk membuat card cuaca dikota kota besar
function createHighlightCard(data, cityName) {
    const highlightsContainer = document.getElementById('worldWeatherHighlights');
    const { temperature, weathercode, is_day } = data.current_weather;
    const weatherInfo = getWeatherInfo(weathercode, is_day === 1);
    const card = document.createElement('div');
    card.className = 'cityHighlightCard';
    card.dataset.cityName = cityName;
    const cityP = document.createElement('p');
    cityP.className = 'cityInfo';
    cityP.textContent = cityName;
    const weatherDiv = document.createElement('div');
    weatherDiv.className = 'weatherInfo';
    const tempSpan = document.createElement('span');
    tempSpan.textContent = `${Math.round(temperature)}°`;
    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined';
    iconSpan.textContent = weatherInfo.icon;
    weatherDiv.appendChild(iconSpan);
    weatherDiv.appendChild(tempSpan);
    card.appendChild(cityP);
    card.appendChild(weatherDiv);
    highlightsContainer.appendChild(card);
}

// Fungsi untuk ngambil data cuaca untuk kota kota besar namun mencari data lokasi kota tersebut melalui Geocoding
async function loadWorldWeatherHighlights() {
    document.getElementById('worldWeatherHighlights').textContent = '';
    const randomCities = worldCities.sort(() => 0.5 - Math.random()).slice(0, 14);
    for (const city of randomCities) {
        try {
            const geoResponse = await fetch(`${geocodingAPI}?name=${encodeURIComponent(city)}&count=1&language=id&format=json`);
            const geoData = await geoResponse.json();
            if (geoData.results && geoData.results.length > 0) {
                const { latitude, longitude, name } = geoData.results[0];
                const weatherData = await getSimpleWeatherData(latitude, longitude);
                createHighlightCard(weatherData, name);
            }
        } catch (error) {
            console.error(`Gagal memuat cuaca untuk ${city}:`, error);
        }
    }
}


/* * ===== PEMICU (EVENT LISTENERS) =====
 * Bagian terakhir ini menghubungkan semua fungsi di atas dengan aksi nyata pengguna.
 * Ibaratnya, ini adalah saklar yang menyalakan fungsi saat dibutuhkan.
*/

// kedua event dibawah adalah event untuk search bar
searchButton.addEventListener('click', handleSearch);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// Event yang dijalankan ketika card harian diclick
dailyForecastContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.dailyCard');
    if (card && card.dataset.dayIndex) {
        const dayIndex = parseInt(card.dataset.dayIndex, 10);
        handleDayClick(dayIndex);
    }
});

// Event yang dijalankan ketika card highlight cuaca diclick 
worldWeatherHighlightsContainer.addEventListener('click', (e) => {
    const card = e.target.closest('.cityHighlightCard');
    if (card && card.dataset.cityName) {
        fetchCoordinates(card.dataset.cityName);    
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchCoordinates('Bandung'); // Tampilkan cuaca Bandung sebagai default.
    loadWorldWeatherHighlights(); // Menampilkan cuaca cuaca dikota kota besar 
    setTimeout(() => {
        if (weatherApp) weatherApp.style.opacity = '1';
    }, 100);
});