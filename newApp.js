const mongodb=require('mongodb');
const MongoClient=mongodb.MongoClient;
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

const path = require('path')
const express = require('express')

const app = express()
app.set('view engine', 'hbs')
const publicDirectoryPath = path.join(__dirname)

app.use(express.static(publicDirectoryPath))
// I need to add html to my project and have the results of the below conflict show up on the screen.
const collectionNobles='Nobles';
const collectionAssasins='Assasins';
const connectionURL='mongodb://127.0.0.1:3443';
const databaseName='Intrigue';

let randomName=()=>{
    return uniqueNamesGenerator({
         dictionaries: [adjectives, colors, animals] });
}
let shortName=()=>{
    return uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors], // colors can be omitted here as not used
    length: 2});
}

app.listen(3443, function(){
    console.log('Intrigue is listening on port 3443')
})


MongoClient.connect(connectionURL, { useNewUrlParser: true }, async (error, client) =>{
    if(error){
        return console.log(error);
    }
    const db=client.db(databaseName);
    const fetchNoblesData=()=>{return db.collection(collectionNobles).find().toArray()};
    const fetchAssasinsData=()=>{return db.collection(collectionAssasins).find().toArray()};
    let NoblesData=await fetchNoblesData();
    let AssasinsData=await fetchAssasinsData();
    
    async function updateLocalData(){
        return NoblesData=await fetchNoblesData(), AssasinsData=await fetchAssasinsData();
    }
    console.log('connection successful!');

    let random={
        assasinsNum: Math.random()*10,
        noblesNum: Math.random()*15,
        aggression: Math.random()*10
    }


    for(i=1; i<=random.assasinsNum; i++){
        if(Math.random()*10<8){
            db.collection('Assasins').insertOne({
                name: shortName(),
                skills:{
                    kick: Math.random()*10,
                    punch: Math.random()*10
                },
                aggression: random.aggression
            });
        }else{
            db.collection('Assasins').insertOne({
                name: randomName(),
                skills:{
                    kick: Math.random()*12,
                    punch: Math.random()*12
                }
            });
        }
    }
    
    
    for(i=0; random.noblesNum>=i; i++){
        if(Math.random()*10<8){
            if(Math.random()*10<8){
                db.collection('Nobles').insertOne({
                    name: shortName(),
                    skills:{
                        kick: Math.random()*9,
                        punch: Math.random()*9
                    }
                });
            }
        }else{
            db.collection('Nobles').insertOne({
                name: randomName(),
                skills:{
                    kick: Math.random()*11,
                    punch: Math.random()*11
                }
            });
        }
        
    }
            AssasinsData.forEach((assasin)=>{
                // kill random noble
                targetNoble=NoblesData[Math.floor(Math.random()*NoblesData.length)]
                if(assasin.aggression>Math.random()*-10){
                    if(assasin.skills.kick>assasin.skills.punch && targetNoble){
                        if(assasin.skills.kick>targetNoble.skills.kick){
                            console.log(targetNoble.name+' was successfully assasinated by '+ assasin.name+ '. dead by kicking')
                            db.collection('Nobles').deleteOne({name: targetNoble.name})
                        }else{
                            console.log(assasin.name+' died attempting to assasinate '+ targetNoble.name+ 'dead by kicking')
                            db.collection('Assasins').deleteOne({name: assasin.name})
                        }
                    }else if(assasin.skills.kick<assasin.skills.punch && targetNoble){
                        if(assasin.skills.punch>targetNoble.skills.punch){
                            console.log(targetNoble.name+'was successfully assasinated by '+ assasin.name+ '. dead by punching')
                            db.collection('Nobles').deleteOne({name: targetNoble.name})
                        }else{
                            console.log(assasin.name+ ' died attempting to assasinate '+ targetNoble.name+ '. dead by punching')
                            db.collection('Assasins').deleteOne({name: assasin.name})
                        }
                    }
                    else if(assasin.skills.kick===targetNoble.skills.kick &&targetNoble){
                        console.log(assasin.name+ ' and '+ targetNoble.name+ 'were both maimed in an assasination attempt. kick / 2')
                        db.collection('Nobles').updateOne({name: targetNoble.name},{
                            kick: kick/2
                        });
                        db.collection('Assasins').updateOne({name: assasin.name},{
                            kick: kick/2
                        });
                    }else if(assasin.skills.punch===targetNoble.skills.punch &&targetNoble){
                        console.log(assasin.name+ ' and '+ targetNoble.name+ 'were both maimed in an assasination attempt. punch / 2')
                        db.collection('Nobles').updateOne({name: targetNoble.name}, {
                            punch: punch/2
                        });
                        db.collection('Assasins').updateOne({name: assasin.name}, {
                            punch: punch/2
                        });
                    }
                    updateLocalData();
                }
            });   
            console.log('Survivors:')
            console.log(`Nobles: ${NoblesData}`);
            console.log(`Assasins:`+ AssasinsData);
});
