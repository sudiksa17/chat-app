const socket = io()

//Elements
const $messageForm =  document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $message = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix : true})

const autoscroll = () => {   
    //New message element
    const $newMessage = $message.lastElementChild

    //Height of the new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight+ newMessageMargin

    //visible height
    const visibleHeight = $message.offsetHeight

    //Height of messages container
    const containerHeight =  $message.scrollHeight

    //How far have i scrolled
    const scrollOffset = $message.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $message.scrollTop = $message.scrollHeight
    }
}

$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    const string = e.target.elements.message.value
    
    socket.emit('sendMessage',string,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()                                                                                                                                                                                                        

      if(error){
          return console.log(error)
      }
      console.log('message delivered')
    })
})

document.querySelector('#send-location').addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Your browser doesnot support geolocation...')
    }

    $locationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position)=>{
        
        socket.emit('sendLocation', {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
        },()=>{
            $locationButton.removeAttribute('disabled')
            console.log('Location shared')
        })
    })
})

socket.on('message',(message)=>{
   console.log(message)
   const html = Mustache.render(messageTemplate,{
       username:message.username,
       message:message.text,
       createdAt: moment(message.createdAt).format('h:mm a')
   })
   $message.insertAdjacentHTML('beforeend',html)
   autoscroll()
})

socket.on('locationMessage',(message)=>{
    console.log(message)
    const html = Mustache.render(locationTemplate,{
        username: message.username,
        locationUrl : message.locationUrl,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $message.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.emit('join',{username,room},(error)=>{
    if(error){
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})