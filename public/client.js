const API_URL = 'http://localhost:5000/login';
const form = document.querySelector('form');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    // variables from the user filled form
    const email = formData.get('email');
    const pass = formData.get('pass');

    // object to be sent to backend
    const loginForm = {
        email: email,
        pass: pass
    }

    // POST req
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(loginForm),
    });
    
});