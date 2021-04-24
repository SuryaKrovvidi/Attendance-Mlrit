
const express = require('express');
const app = express();

const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');

const axios = require('axios');

const apiToken = '850881448:AAFEBdWZQsI3PyXOXHpycXOhXrWGXzVQgeI';
//const telegram = require('telegram-bot-api');

const TelegramBot = require('node-telegram-bot-api');

const bodyParser = require('body-parser');

const port = 80;

app.use(bodyParser.json());

const screen = {
  width: 640,
  height: 480
};


const api = new TelegramBot(apiToken, {polling: true});

api.onText(/\/start/, (msg) => {
	
  const chatId = msg.chat.id;
  const resp = "Send your RollNumber and password seperated by space (roll password)";  
  
  api.sendMessage(chatId, resp);
});

api.on('message',function(message){

	if(message.text == "/start") return;
	var chat_id = message.chat.id;
	var msg = message.text;
	var details = msg.split(" ");
	if(details.length < 2){
		
		api.sendMessage(chat_id,"Invalid format");
		return;
	}
	global.roll = details[0];
	global.password = details[1];

	(async function example() {
		
	  let driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options().headless().windowSize(screen))
	  									.build();
		
	  try {
	    await driver.get('http://103.15.62.229/results/mlrit-login/index.php');
	    await driver.findElement(By.xpath('/html/body/div/section/div[1]/div/div[2]/div/form/div[1]/div/input')).sendKeys(roll, Key.RETURN);
	    await driver.findElement(By.xpath('/html/body/div/section/div[1]/div/div[2]/div/form/div[2]/div/input')).sendKeys(password, Key.RETURN);

	    if(await driver.getCurrentUrl() != 'http://103.15.62.229/results/Students_Corner_Frame.php#'){
      		api.sendMessage(chat_id, "Invalid credentials");
      		return;
    	}
	  	
	  	api.sendMessage(chat_id,"Fetching Results...");	

	    await driver.get('http://103.15.62.229/results/student_attendance.php');
	    var name = await driver.findElement(By.xpath('/html/body/div/table[1]/tbody/tr[2]/td/b')).getText();
      	name = name.toLowerCase();
      	name = name.replace(/(^\w{1})|(\s{1}\w{1})/g, match => match.toUpperCase());
	    var subs = [];
	    var percentages = [];
	    var total=0.0;

	    for(var i=2;i<=13;i++){
		    subs[i] = await driver.findElement(By.xpath('/html/body/div/table[4]/tbody/tr[2]/th[' + i + ']')).getText();
		    subs[i] = subs[i].replace(/\n/g, " ");
		    percentages[i] = await driver.findElement(By.xpath('/html/body/div/table[4]/tbody/tr[5]/th[' + i + ']')).getText();
		    total = total + parseFloat(percentages[i]);
	    }

	    // for(var i=2;i<=13;i++){
	    // 	 percentages[i] = await driver.findElement(By.xpath('/html/body/div/table[4]/tbody/tr[5]/th[' + i + ']')).getText();
	    // 	 total = total + parseFloat(percentages[i]);
	    // }
	    var avg = total/12.0;
	    
	    await driver.get('http://103.15.62.229/results/logout.php');

	    var response = "Name: "+name+"\n\n";

	    for(var i=2;i<subs.length;i++){
	    	//console.log(subs[i] + " ---> " + percentages[i]);
	    	response = response + subs[i] + "  :  " + percentages[i] + "%\n";
	    }
	    response = response + "\nAverage Attendance : " + avg.toPrecision(4) + "%\n";

	    api.sendMessage(chat_id,response);
	    

	  } catch(err){
	  	api.sendMessage(chat_id, "Something went wrong. Make sure your credentials are correct.");
	  }
	  finally {
	    await driver.quit();
	    console.log("Success!");
	  }
  
	})();

});				///html/body/div/table[1]/tbody/tr[2]/td/b


app.get("/",(req,res) => {
	return res.send('Working');
});


app.listen(process.env.PORT || port, function(){
	console.log("Listening on port " + port );
});