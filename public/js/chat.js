const socket = io();

//  Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $geolocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//  Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const geolocationMessageTemplate = document.querySelector('#geolocation-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
//  Options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {

    $messages.scrollTop = $messages.scrollHeight;

}

socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm:ss')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
})

socket.on('geolocation-message-from-server', (message) => {
    console.log(message);
    const html = Mustache.render(geolocationMessageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('HH:mm:ss')
    });
    $messages.insertAdjacentHTML('beforeend', html);
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    // console.log(message);
    socket.emit('messageFromUser', message, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('message delivered');
    });

})

$geolocationButton.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }

    $geolocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        $geolocationButton.setAttribute('disabled', 'disabled');
        console.log(position.coords);
        socket.emit('message-geolocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            if (error) {
                return console.log(error);
            }
        });
        $geolocationButton.removeAttribute('disabled');
        autoscroll();

    })


})

socket.emit('userJoin', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});