#!/bin/bash

function pause(){
   read -p "$*"
}

node app.js

pause 'Press [Enter] key to continue...'

