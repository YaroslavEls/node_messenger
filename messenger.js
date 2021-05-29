'use strict'

//const fs = require('fs');
const { setegid } = require('process');
const readline = require('readline');

const back = require('./back.js');

const backend = new back;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});

let status = false;
let currentLogin;

const commands = {
    help() {commandsList()},
    hotkeys() {hotkeysList()},
    registration() {registrationScreen()},
    login() {loginScreen()},
    logout() {logoutScreen()},
    account() {accountScreen()},
    friends() {friendsScreen()},
    messages() {messageScreen()},
    news() {newsScreen()},
    notifications() {},
    exit() {rl.close()}
};

const commandsDescription = {
    help: 'see the full commands list',
    hotkeys: 'see the full hotckeys list',
    registration: 'create a new account (new login and password)',
    login: 'sign in to an existing account (login and password required)',
    logout: 'sign out from an account',
    account: 'get or set information about your account',
    friends: 'check your friend list and add new friends',
    messages: 'check message history and write new messages',
    news: 'see the latest news from other users',
    notifications: '',
    exit: 'stop running Node Messanger'
}

const hotkeysDescription = {
    login: 'Ctrl + q',
    account: 'Ctrl + w',
    messages: 'Ctrl + e',
    news: 'Ctrl + r',
    notifications: 'Ctrl + t'
}

const messages = {
    greeting: 'Welcome to Node Messenger (° ͜ʖ͡°)╭∩╮',
    unknown: 'Unknown command',
    helpComm: 'type "help" to see the command list',
    logComm: 'type "login" for login',
    regComm: 'type "registration" for registration',
    logFail: 'Authorization failed',
    logSuccess: 'You are successfully logged in',
    logoutFail: 'You are not logged in',
    logoutSuccess: 'You have logged out',
    regFail: 'Registration failed',
    regSuccess: 'Your account has been successfully created',
    infoAddSuccess: 'Information successfully added',
    infoAddLater: 'You can always add information later',
    infoCheck: 'Information about your account:',
    infoUpdate: 'Information was updated successfully',
    passCheckFail: 'Password is incorrect',
    passChangeSuccess: 'Password was successfully changed',
    passChangeFail: 'Password mismatch',
    loggedIn: 'You are logged in',
    notLoggedIn: 'You are not logged in',
    invalidInput: 'Invalid input, please try again:',
    messageSuccess: 'The message was successfully sent',
    messagesNew: 'You don`t have any messages with this user',
    bye: 'Goodbye. Have a good day!'
}

const colors = {
    white: '\u001b[37m',
    red: '\u001b[31m',
    green: '\u001b[32m',
    cyan: '\u001b[36m'
}

const profileInfo = [
    'name',
    'birth',
    'country',
    'city',
    'info',
    'password'
]

const registrationQuestions = [
    'What is your name? ',
    'How old are you? ',
    'What country are you from? ',
    'In which city of do you live? ',
    'You can add some extra info about yourself: '
]

function showMessage(text, color) {
    let index = colors[color];
    console.log(`${index}${text}\u001b[37m`);
}

function commandsList() {
    const commandsKeys = Object.keys(commands);
    const commandsValues = Object.values(commandsDescription);

    for (let i = 0; i < commandsKeys.length; i++) {
        console.log('\u001b[36m' + commandsKeys[i] + '\u001b[37m: ' + commandsValues[i]);
    }
}

function hotkeysList() {
    const hotkeysKeys = Object.keys(hotkeysDescription);
    const hotkeysValues = Object.values(hotkeysDescription);

    for (let i = 0; i < hotkeysKeys.length; i++) {
        console.log('\u001b[36m' + hotkeysValues[i] + '\u001b[37m: ' + hotkeysKeys[i]);
    }
}

function question(str) {
    return new Promise(resolve => {
        rl.question(str, resolve)
    });
}

async function loginScreen() {
    if (status) {
        showMessage(messages.loggedIn, 'red');
        return;
    }

    const login = await question(`Login: `);
    const password = await question(`Password: `);

    const bool = await backend.checkAccount(login, password);

    if (bool) {
        showMessage(messages.logSuccess, 'green');
        status = true;
        currentLogin = login;
    } else {
        showMessage(messages.logFail, 'red');
    }

    rl.prompt();
}

function logoutScreen() {
    if (status) {
        showMessage(messages.logoutSuccess, 'green');
        status = false;
    } else {
        showMessage(messages.logoutFail, 'red');
    }
}

async function registrationScreen() {
    if (status) {
        showMessage(messages.loggedIn, 'red');
        return
    }

    const login = await question(`Create a login: `);
    const password = await question(`Pick a password: `);

    const bool = await backend.createAccount(login, password);

    if (bool) {
        showMessage(messages.regSuccess, 'green');
        status = true;
        currentLogin = login;

        const additional = await question('Would you like to add some extra info to your profile? [y/n]: ')
        if (additional === 'y' || additional === 'yes') {
            const infoArray = [];
            for (let i = 0; i < 5; i++) {
                let answer = await question(`${registrationQuestions[i]}`);
                infoArray.push(answer);
            }

            await backend.addInfo(login, infoArray);
            showMessage(messages.infoAddSuccess, 'green');
        } else {
            const infoArray = ['', '', '', '', ''];
            await backend.addInfo(login, infoArray);
            showMessage(messages.infoAddLater, 'white');
        }
    } else {
        showMessage(messages.regFail, 'red');
    }

    rl.prompt();
}

async function infoScreen() {
    const infoObject = await backend.getInfo(currentLogin);
    console.log('\x1b[1A');
    showMessage(messages.infoCheck, 'white');
    console.log('\u001b[0m' + '\x1b[1A');
    console.table(infoObject);
    console.log('\u001b[37m' + '\x1b[1A');
}

let infoRecursion = 0;

async function editInfoScreen() {
    const infoObject = await backend.getInfo(currentLogin);

    if(infoRecursion === 0) {
        console.log('What do you want to change:')

        for (let i = 0; i < profileInfo.length; i++) {
            console.log(`${i+1} - ${profileInfo[i]}`)
        }
    }

    const input = await question('[1/2/3/4/5/6]: ');

    if ((+input > 0) && (+input < 6)) {
        const item = profileInfo[+input - 1];
        
        infoObject[item] = await question('New information: ');

        await backend.changeInfo(currentLogin, infoObject);

        showMessage(messages.infoUpdate, 'green');
        infoRecursion = 0;
    } else if (+input === 6) {
        const currentPassword = await question('Current password: ');
        const result = await backend.checkAccount(currentLogin, currentPassword);
        if (result) {
            const newPasswordFirst = await question('Enter new password: ');
            const newPasswordSecond = await question('Repeat new password: ');

            if (newPasswordFirst === newPasswordSecond) {
                await backend.changePassword(currentLogin, newPasswordFirst);
                showMessage(messages.passChangeSuccess, 'green');
            } else {
                showMessage(messages.passChangeFail, 'red');
            }
        } else {
            showMessage(messages.passCheckFail, 'red');
        }
    } else if(input === '') {
        return;
    } else {
        showMessage(messages.invalidInput, 'red');
        infoRecursion++;
        await editInfoScreen();
    }

}

async function accountScreen() {
    if (!status) {
        showMessage(messages.notLoggedIn, 'red');
    }

    const info = await question(`Do you want to see or edit your account? [see/edit]: `);

    if (info === 'see' || info === 's') {
        await infoScreen();
    } else if (info === 'edit' || info === 'e') {
        await editInfoScreen();
    } else {
        showMessage(messages.invalidInput, 'red');
        await accountScreen();
    }

    rl.prompt();
}

async function friendsScreen() {
    if (!status) {
        showMessage(messages.notLoggedIn, 'red');
        return
    }

    const friendList = await backend.getFriends(currentLogin);

    console.log('\x1b[1A');
    console.log('Your friends:');

    for (let i = 0; i < friendList.length; i++) {
        console.log(`${i+1}. ` + friendList[i]);
    }

    const add = await question('Do you want to add a new friend? [y/n]: ');
    if (add === 'y' || add === 'yes') {
        const newFriend = await question('Enter username: ');
        await backend.addFriend(currentLogin, newFriend);
    }

    rl.prompt();
}

async function writeMessage() {
    const partner = await question('Who do you want to write to? [username]: ');
    if (partner === '') return;
        
    const infoObject = await backend.getMessages(currentLogin, partner);
    if(infoObject === undefined) {
        showMessage(messages.messagesNew, 'white');
    } else {
        const dialog = infoObject.join('\n');
        let newDialog = dialog.split(`${partner}`).join(`\u001b[34m${partner}\u001b[37m`);
        newDialog = newDialog.split(`${currentLogin}`).join(`\u001b[35m${currentLogin}\u001b[37m`);
        console.log(newDialog);
    }

    const text = await question('\u001b[36m(if you want to send file, type "send file")\u001b[37m\nNew message: ');
    if (text === 'send file') {
        const file = await question('Enter file path: ');
        await backend.sendFile(partner, file);
        await backend.addMessage(currentLogin, partner, `\u001b[35msent file\u001b[37m`)
    } else if (text !== '') { 
        await backend.addMessage(currentLogin, partner, text);
        console.log(`\u001b[35m${currentLogin}\u001b[37m: ${text}`);
    }
}

async function messageScreen() {
    if (!status) {
        showMessage(messages.notLoggedIn, 'red');
        return
    }

    const chats = await backend.getChats(currentLogin);
    const friends = await backend.getFriends(currentLogin);

    const difference = (s1, s2) => new Set(
        [...s1].filter(v => !s2.has(v))
    );

    const dif1 = new Set(friends);
    const dif2 = new Set(chats);

    const resArr = Array.from(difference(dif1, dif2));

    console.log('\x1b[1A');
    console.log('Available chats:')

    for (let i = 0; i < chats.length; i++) {
        console.log('- ' + chats[i])
    }

    console.log('\x1b[1A');
    console.log('Friends you have no chats with:')

    for (let i = 0; i < resArr.length; i++) {
        console.log('- ' + resArr[i]);
    }

    await writeMessage();

    rl.prompt();
}

async function newsScreen() {
    if (!status) {
        showMessage(messages.notLoggedIn, 'red');
        return
    }

    const news = await backend.getNews();

    console.log('\x1b[1A');
    console.log('Latest news:')

    for (let i = 0; i < news.length; i++) {
        console.log(news[i]);
    }

    const add = await question('Do you want to post something? [y/n]: ');
    if (add === 'y' || add === 'yes') {
        const news = await question('Enter text: ');
        await backend.addNews(currentLogin, news);
    }

    rl.prompt();
}


backend.checkDB();
console.clear();
showMessage(messages.greeting, 'white');
showMessage(messages.helpComm + '\n', 'cyan');
rl.prompt();

rl.on('line', (line) => {
    line = line.trim();
    const command = commands[line];
    if (command) {
        command();
    } else {
        showMessage(messages.unknown, 'red');
    }
    rl.prompt();
}).on('close', () => {
    showMessage(messages.bye, 'white');
    process.exit(0);
}).on('SIGINT', () => {});


readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
    //console.log(key)

    // if (key.name === 'q' && key.ctrl) {
    //     commands.login();
    // } else if (key.name === 'w' && key.ctrl) {
    //     commands.account();
    // } else if (key.name === 'e' && key.ctrl) {
    //     commands.messages();
    // } else if (key.name === 'r' && key.ctrl) {
    //     commands.news();
    // } else if (key.name === 't' && key.ctrl) {
    //     commands.notifications();
    // }
})