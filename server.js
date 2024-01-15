import  express  from "express"
import mongoose from "mongoose"
import cors from "cors"
import Players from "./models/player.js"
import User from "./models/user.js"
import errorHandler from "./middlewares/errorMiddleware.js"

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());
app.use(errorHandler);

const CONNECTION_URL = "mongodb+srv://IPL_AUCTION_24:auction%402024@cluster0.ilknu4v.mongodb.net/IPL?retryWrites=true&w=majority";

mongoose.connect(CONNECTION_URL,{useNewUrlParser:true,useUnifiedTopology:true,family: 4})
.then(()=>{
    console.log('connected to mongoDB successfully');
}).catch(err=>{console.log('No connection')});

app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`);
});

app.get("/",(req,res)=>{
    res.send("<h1>Hello world</h1>");

});


//user verification
app.post("/login", async (req, res, next) => {
    try {
       const { username, password, slot } = req.body;
       const user = await User.findOne({ username, slot });
 
       if (user) {
          if (password === user.password) {
             res.send({ message: "login successful", user: user });
          } else {
             res.send({ message: "password does not match" });
          }
       } else {
          res.send({ message: "user not found" });
       }
    } catch (err) {
       console.log(err);
       next(err);
    }
 });
 
 //test completed for login


/*
 The adminAddPlayer is used to add a new player
 this will consist of a form with 4 parameters 
 1. player name (player which is sold)
 2. team name (which team was this sold eg mi csk rr etc)
 3. slot no
 4.cost (cost at which player is sold) in cr if its 50L then admin should type 0.5
 
    in this method a new player will be added in the database of the user using _id 
    here we will also use mongoose change stream to listen to realtime database 
    changes to no need of refreshing is required
*/
app.post("/adminAddPlayer", async (req, res ,next) => {
    try {
        const { playerName, teamName, slot, buget } = req.body;

        const user = await User.findOne({ teamName, slot });

        if (user) {
            const player = await Players.findOne({ playerName });

            if (player) {
                if (player.isSold === false) {
                    const newbuget = user.buget - (buget*10000000);
                    
                    if (newbuget < 0) {
                        return res.send({ message: "Not enough buget" });
                    } else {
                        player.isSold = true;
                        user.buget = newbuget;
                        
                        if (!user.players.includes(player._id)) {
                            user.players.push(player._id);
                        }

                        await user.save();
                        await player.save();
                        return res.send({message:"New player added successfully",user:user});
                    }
                } else {
                    return res.send({ message: "Player is already sold" });
                }
            } else {
                return res.send({ message: "Player not found" });
            }
        } else {
            return res.send({ message: "User not found" });
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

/*testing of this is completed but additional constraints will be added in thr frontend 
such as limited no of women players batsman bowler etc
*/

/*
    admin Add powercard is used to add powercards this will contain
    1. teamName
    2. slot 
    3. powercard to be added (note this should be a drop box to avoid errors)
    simple code that adds power card very self explanitory
    
*/
app.post("/adminAddPowerCard", async (req, res ,next) => {
    try {
        const { teamName, slot, powercard } = req.body;
        const user = await User.findOne({ teamName, slot });
        if (user) {
            const result = user.powercards.find(pc => pc.name === powercard);
            if (!result) {
                user.powercards.push({ name: powercard, isUsed: false });
                await user.save();

                return res.send({ message: "Power card added successfully" ,user:user});
            } else {
                return res.send({ message: "Power card already present" });
            }
        } else {
            return res.send({ message: "User not found" });
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
});


await test(1000, []);

async function test(timeInMs, pipeline = []) {
    const changeStream = User.watch(pipeline);
    changeStream.on('change', async (next) => {
        const updatedFields = next.updateDescription.updatedFields;
        if (updatedFields && updatedFields.players) {
            const playersArray = updatedFields.players;
            console.log('Updated Players Array:', playersArray);
        }
    });
}





// testing complete

/**
 * admin delete player will help to delete player
 * after player is deleted buget will be added (has to input by admin)
 * is sold will be set to false 
 * and player will be deleted from players array
 * input will be
 * 1.playerName
 * 2.teamName
 * 3.slot
 * 4.bugetToAdd
 */

app.post("/adminDeletePlayer", async (req, res, next) => {
    try {
      const { playerName, teamName, slot, bugetToAdd } = req.body;
      const user = await User.findOne({ teamName, slot });
  
      if (user) {
        const player = await Players.findOne({ playerName }).select('_id');
  
        if (player) {
          const playerIndex = user.players.findIndex(playerId => playerId.equals(player._id));
  
          if (playerIndex !== -1) {
            player.isSold = false;
            await player.save();
            user.buget = user.buget + (bugetToAdd*10000000);
            user.players.splice(playerIndex, 1); 
            await user.save();
            return res.send({ message: "Player deleted successfully", user: user });
          } else {
            return res.send({ message: "Player does not exist with this user" });
          }
        } else {
          return res.send({ message: "Player not found" });
        }
      } else {
        return res.send({ message: "User not found" });
      }
    } catch (err) {
      next(err);
    }
  });
  
// testing complete

//NOTE ERROR MIDDLEWARE IS NOT WORKING 

/**
 * for dashboard app.get("/user?id=65983c2dd3ee69e3940a22dc")
 * also for spectate
 * const id = req.params 
 * after login store user id in frontend 
 * 1. players ka array(_id)
 * 2. buget
 * 3. powercard ka array
 * 4.team name + slot
 */

/**
 * for leaderboard 
 * 1. score kskksk
 * 2. team name + slot 
 */


// ipl -> user (player array ref form player) player

//testing code

// async function test1(){
//     try{
//         const player = await User.find();
//         console.log(player);
//     }catch(err){
//         next(err);
//     }
// }

// test1();