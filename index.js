const express = require('express');
const cors = require('cors');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const monk = require('monk')
const packagePublicIp = require('public-ip');
const session = require('express-session')
const path = require('path')
var crypto = require("crypto");
var sha256 = crypto.createHash("sha256");
var bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.static('views'));
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(bodyParser.json());
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));


// DB connection URL
const url = 'localhost:27017/SVH';
const db = monk(url);
const portsInUse = db.get('portsInUse');
const users = db.get('users');
portsInUse.drop();

db.then(() => {
  console.log('Connected correctly to server localhost:27017/SVH')
})


// RENDERS 
app.get('/', (req, res) => {
    res.render('index.html');
});

app.get('/create_server', (req, res) => {
    res.render('createServer.html');
});

app.get('/join', async (req, res) => {
    res.render('join.html');
});


// CREATE SERVER 
async function getFreePort(){
    for(let i=2222; i<2230; i++){
        let freePort = await portsInUse.find({port: { $eq: i.toString() }}, {port: 1}, (e, ports) => {
            if(e){
                console.error(e);
            } else{
                return ports.length == 0 ? true : false;
            }
        });
        if(freePort.length == 0)
            return i;
    }

}

async function getContainerIp(containerId){
    const { stdout, stderr } = await exec('docker inspect -f "{{ .NetworkSettings.IPAddress }}" ' + containerId);
    if(stderr){
        console.error(stderr)
    } else{
        if(stdout.endsWith('\n'))
            return stdout.slice(0, -1);
        else
            return stdout;
    }
}

async function createServer(_imgObject) {
    const { stdout, stderr } = await exec('docker run -p 192.168.1.6:' + _imgObject.port + ':22 -h ' + _imgObject.name + ' -id rastasheep/ubuntu-sshd');
    let containerId = '';
    if(stderr){
        console.error(stderr)
    } else{
        if(stdout.endsWith('\n'))
            containerId = stdout.slice(0, -2);
        else
            containerId = stdout;
        const containerIp = await getContainerIp(containerId);
        return {ip: containerIp, id: containerId};
    }
}

// -- post server 
app.post('/create_server', async (req, res) => {
    let freePort = await getFreePort();
    const publicIp = await packagePublicIp.v4();

    const imgObject = {
        name: req.body.name,
        os: req.body.os,
        cpu: req.body.cpu,
        mem: req.body.mem,
        port: freePort.toString()
    }
    const container = await createServer(imgObject);
    imgObject.id = container.id;
    imgObject.ip = container.ip;
    imgObject.publicIp = publicIp;

    console.log(imgObject);

    await portsInUse.insert(imgObject);


    res.json(imgObject);
});

// LOGIN
app.post('/login', async (req, res) => {
    const username = req.body.username;
    const pass = req.body.password;

    console.log(username, pass)
    const hash = sha256.update(pass, "utf8").digest("base64");
    if(users.find({email: {$eq: username.toLowerCase()}, pass: {$eq: hash}}, {}, (e, users) => {})){
        // res.redirect('/create_server');
        return {data: {username: 'Victor', access_token: 'TOKENCOAIE'}}
    } else{
        console.log('nope');
    }
});

// POST JOIN
app.post('/join', async (req, res) => {
    const name = req.body.name;
    const mail = req.body.mail;
    let pass = req.body.pass;
    pass = sha256.update(pass, "utf8").digest("base64");
    const user = {
        name: name,
        email: mail.toLowerCase(),
        pass: pass
    };
    console.log(user);
    await users.insert(user);
    res.redirect('/');
});

app.listen(5000, () => {
    
});
