const form = document.querySelector('form');
const API_URL = 'http://localhost:5000/create_server';


// Handle 'RUN' button press
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);

    // variables from the user filled form
    const name = formData.get('name');
    const os = formData.get('os');
    const cpu = formData.get('cpu');
    const mem = formData.get('mem');

    let pIp = document.getElementById('containerIp');
    let pId = document.getElementById('containerId');

    // object to be sent to backend
    const imgObject = {
        name: name,
        os: os,
        cpu: cpu,
        mem: mem
    }

    // POST req
    fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify(imgObject),
        headers:{
            'content-type': 'application/json'
        }
    }).then(response => response.json())
        .then(createdContainer =>{
            pIp.innerText = 'Server public IP: ' + createdContainer.publicIp + ':' + createdContainer.port;
            pId.innerText = 'Server ID: ' + createdContainer.id;
            console.log(createdContainer);
            
        });
    


});