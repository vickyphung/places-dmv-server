const express = require('express');
const router = express.Router();
const user = require('../models/user');
const place = require('../models/place')
const bcrypt = require('bcrypt');
const saltRounds = process.env.SALT_ROUNDS;
const jwtSecret = process.env.JWT_SECRET;
const jwt = require('jwt-simple');
const { validate, login } = require('../middlewares');

//Create User
    router.post('/', async (req, res) => {
        const salt = await bcrypt.genSalt(Number(saltRounds)); 
        // creates the "salt" which is kind of like a key for bcrypt to use
        let hashedPass = await bcrypt.hash(req.body.password, salt); // hashes the password that was input by the user so that the raw one doesn't make it to the database
        // const userData = req.body
        user.create({
            name: req.body.name,
            password: hashedPass        
        }, (error, createdUser) => {
        if (error) {
            console.error(error);
            res.status(400).json({
            error: 'Error occured. User not created.'
            })
        } else {
            console.log('User created successfully.');
            let encoded = jwt.encode({ // if no errors, encode the username and hashed password to a jwt token using the JWT_SECRET from our .env file
                password: createdUser.password,
                name: createdUser.name,
                id: createdUser._id
            }, jwtSecret);
            res.status(201).json({
                jwtToken: encoded, // sends a 201 with created token
                message: 'Success! User has been created.',
                user: createdUser
            })
        }
        })
    })
  
    router.get('/', (req, res) => {
        res.status(200).json({
        message: "user index"
        });
    }
    );

    router.get("/id", validate, (req, res)=>{
        user.find({_id: req.id}, (err, user)=>{
            if(err){
                res.status(404).json({
                    message: "Could not find user with that ID."
                })
            } else {
                res.status(200).json({user: user})
            }
        })
    })


    // router.get("/account/:userId", (req, res)=>{
    //     place.find({_id: req.params.userId}, (err, place)=>{
    //         if(err){
    //             res.status(404).json({message: "Could not find a user with that Id."})
    //         } else {
    //             res.status(200).json({user})
    //         }
    //     })
    // })

    router.get("/all", (req, res)=>{
        user.find((err, allUsers)=>{
            if(err){
                res.status(404).json({
                    message: "Error. No user data found."
                })
            } else {
                res.status(200).json({
                usersList: allUsers})
            }
        })
    })


  
//Delete User + User from Places favorite_users list.
router.delete('/delete', validate, (req, res) => {
    user.find({_id: req.id}, (error, foundUser) => {
                if (error) {
                    console.error(error)
                    res.status(404).json({ 
                        error: "User not found."
                    })
                } else {
                    place.updateMany({
                        $in: {
                        _id: foundUser.favorites
                        }
                    }, {
                    $pull: {
                        favorite_users: foundUser._id 
                    }
                    }, (error, updatedPlace) => {
                        if (error) {
                            console.error("Error. User not removed from places.favorite_users."); 
                            res.status(404).json({
                                error: "User not removed from favorite_user lists."
                            })
                        } else {
                            user.deleteOne({
                                _id: req.id 
                            }, (error, outputA) => {
                                if (error) {
                                    console.error(error); 
                                    res.status(404).json({
                                        error: "No user to delete found."
                                    })
                                } else {
                                    console.log('user ded');
                                    res.status(204).json({
                                    message: "User deleted."
                                    }); 
                                }
                            }
                            )
                        }
                    }
                    )
                }
            }
        )
    })

router.delete("/all/clear", (req, res)=>{
    user.deleteMany((err)=>{
        if(err){
            res.status(404).json({message: "pft couldn't even delete everything"})
        }else{
            res.status(204).json({message: "ERRE User HAS BEEN DELETED"})
        }
    })
})

router.put('/favorite/add/:placeId', validate,  (req, res) => {
    user.updateOne({ 
        _id: req.id 
    }, {
        $push: {
        favorites: req.params.placeId
        }
    }, (error, updatedUser) => {
        if (error) {
            console.error(error);
            res.status(404).json({ 
                error: 'No user to add favorite to.'
            });
        } else {
            place.updateOne({
                _id: req.params.placeId
            }, {
                $inc: {
                    favorites: 1
                }, 
                $push: {
                favorite_users: req.id
                }
            }, (error, updatedPlace) => {
                if (error) {
                    console.error(error); 
                    res.status(404).json({
                        error: 'Could not update the favorites of place.'
                    })
                } else {
                    res.status(202).json({
                        message: 'Successfully updated the user and place favorite lists.'
                    })
                }
            })
        }
    })
})




router.put("/favorite/put/:userId/:placeId", (req, res) => {
  user.updateOne(
    {
      _id: req.params.userId,
    },
    {
      $push: {
        favorites: req.params.placeId,
      },
    },
    (error, updatedUser) => {
      if (error) {
        console.error(error);
        res.status(404).json({
          error: "Error. No user found to add favorite.",
        });
      } else {
        place.updateOne(
          {
            _id: req.params.placeId,
          },
          {
            $inc: {
              favorites: +1,
            },
            $push: {
              favorite_users: req.params.userId,
            },
          },
          (error, updatedPlace) => {
            if (error) {
              console.error(error);
              res.status(404).json({
                error: "Could not add favorite from place.",
              });
            } else {
              res.status(202).json({
                message:
                  "Successfully updated the user and place favorite lists.",
              });
            }
          }
        );
      }
    }
  );
});




router.put('/favorite/remove/:userId/:placeId', (req, res) => {
    user.updateOne({ 
        _id: req.params.userId 
    }, {
        $pull: {
        favorites: req.params.placeId
        }
    }, (error, updatedUser) => {
        if (error) {
            console.error(error);
            res.status(404).json({ 
                error: 'Error. No user found to remove favorite.'
            });
        } else {
            place.updateOne({
                _id: req.params.placeId
            }, {
                $inc: {
                    favorites: -1
                }, 
                $pull: {
                favorite_users: req.params.userId
                }
            }, (error, updatedPlace) => {
                if (error) {
                    console.error(error); 
                    res.status(404).json({
                        error: 'Could not remove favorite from place.'
                    })
                } else {
                    res.status(202).json({
                        message: 'Successfully updated the user and place favorite lists.'
                    })
                }
            })
        }
    })
})



router.put("/update/:id", (req, res)=>{
    const id = req.params.id
    const updatedUser = req.body
    user.findByIdAndUpdate(id, updatedUser, {new: true},(err, updatedUser)=>{
        if(err){
            res.status(404).json({message: "User not updated."})
        } else {
            res.status(202).json({message: "User updated.",
            place: updatedUser})
        }
    })
})

// Login

router.post('/login', login, (req, res) => {
    if (req.result) { // if the result of the "login" middleware is true
      let encoded = jwt.encode({ 
        password: req.password, // make a new jwt token using the username and password from the "login" middleware
        name: req.name,
        id: req.id
      }, jwtSecret);
      res.status(200).json({
        jwtToken: encoded // sends back a 200 with the jwtToken
      });
    } else {
      res.status(403).json({}); // else sends back a 403 forbidden
    }
  });


module.exports = router