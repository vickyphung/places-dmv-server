const express = require('express');
const router = express.Router();

const place = require('../models/place');
const review = require('../models/review');
const user = require('../models/user');

const bcrypt = require('bcrypt');
const saltRounds = process.env.SALT_ROUNDS;
const jwtSecret = process.env.JWT_SECRET;
const jwt = require('jwt-simple');
const { validate, login } = require('../middlewares');

// router.post("/add", (req, res) =>{
//     const placeData = req.body
//     place.create(placeData, (error, createdPlace) =>{
//         if (error){
//             console.error(error);
//             res.status(400).json({
//                 error: "Error occured. Place not created."
//             })
//         } else {
//             console.log("Place created successfully.");
//             res.status(200).json({
//                 message: "Place was successfully created.",
//                 place: createdPlace
//             })
//         }
//     })
// })

router.post("/add", (req, res) =>{
  const placeData = req.body
  place.create(placeData, (error, createdPlace) =>{
      if (error){
          console.error(error);
          res.status(400).json({
              error: "Error occured. Place not created."
          })
      } else {
          console.log("Place created successfully.");
          res.status(200).json({
              message: "Place was successfully created.",
              place: createdPlace
          })
      }
  })
})

router.put("/add/:placeId", validate, (req, res) => {
  user.updateOne(
    {
      _id: req.id,
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
          error: "No user to add favorite to.",
        });
      } else {
        place.updateOne(
          {
            _id: req.params.placeId,
          },
          {
            $inc: {
              favorites: 1,
            },
            $push: {
              favorite_users: req.id,
            },
          },
          (error, updatedPlace) => {
            if (error) {
              console.error(error);
              res.status(404).json({
                error: "Could not update the favorites of place.",
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


router.put("/favorite/add/:placeId", validate, (req, res) => {
  user.updateOne(
    {
      _id: req.id,
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
          error: "No user to add favorite to.",
        });
      } else {
        place.updateOne(
          {
            _id: req.params.placeId,
          },
          {
            $inc: {
              favorites: 1,
            },
            $push: {
              favorite_users: req.id,
            },
          },
          (error, updatedPlace) => {
            if (error) {
              console.error(error);
              res.status(404).json({
                error: "Could not update the favorites of place.",
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

router.put("/favorite/put/:userId/:placeId", (req, res) => {
  user.updateOne(
    {
      _id: req.params.userId,
    },
    {
      $pull: {
        favorites: req.params.placeId,
      },
    },
    (error, updatedUser) => {
      if (error) {
        console.error(error);
        res.status(404).json({
          error: "Error. No user found to remove favorite.",
        });
      } else {
        place.updateOne(
          {
            _id: req.params.placeId,
          },
          {
            $inc: {
              favorites: -1,
            },
            $pull: {
              favorite_users: req.params.userId,
            },
          },
          (error, updatedPlace) => {
            if (error) {
              console.error(error);
              res.status(404).json({
                error: "Could not remove favorite from place.",
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


router.put("/favorite/remove/:userId/:placeId", (req, res) => {
  user.updateOne(
    {
      _id: req.params.userId,
    },
    {
      $pull: {
        favorites: req.params.placeId,
      },
    },
    (error, updatedUser) => {
      if (error) {
        console.error(error);
        res.status(404).json({
          error: "Error. No user found to remove favorite.",
        });
      } else {
        place.updateOne(
          {
            _id: req.params.placeId,
          },
          {
            $inc: {
              favorites: -1,
            },
            $pull: {
              favorite_users: req.params.userId,
            },
          },
          (error, updatedPlace) => {
            if (error) {
              console.error(error);
              res.status(404).json({
                error: "Could not remove favorite from place.",
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









router.get("/", (req, res)=>{
    place.find()
    .sort('name')
    .populate({
        path: 'reviews',
        select: 'review user',
        options: { _recursed: true }    
    })
    .exec
    ((err, allPlaces)=>{
        if(err){
            res.status(404).json({message: "Error. No place data found."})
        } else {
            res.status(200).json({message: "places to go",
            placesList: allPlaces})
        }
    })
})

router.get("/all/tags", (req, res)=>{
    place.find({}, {tags: 1, _id:0 }, (err, place)=>{
        if(err){
            res.status(404).json({message: "Could not find categories."})
        } else {
            res.status(200).json({categories: place})
        }
    })
})

router.get("/get/:state/:tag", (req, res)=>{
    const state = req.params.state
    const tag = req.params.tag
    place.find()
    .where('location.state').equals(state)  
    .where('tags').equals(tag)  
    .sort('name')
    .exec
    ((err, allPlaces)=>{
        if(err){
            res.status(404).json({message: "Error. No place data found."})
        } else {
            res.status(200).json({message: "places to go",
            placesList: allPlaces})
        }
    })
})


router.get("/name/:name", (req, res)=>{
    const name = req.params.name
    place.findOne({name: name,}, (err, place)=>{
        if(err){
            res.status(404).json({message: "Could not find a place with that name."})
        } else {
            res.status(200).json(place)
        }
    })
})

router.get("/id/:placeId", (req, res)=>{
    place.find({_id: req.params.placeId}, (err, place)=>{
        if(err){
            res.status(404).json({message: "Could not find a place with that Id."})
        } else {
            res.status(200).json(place)
        }
    })
})

router.get("/tag/:tag", (req, res)=>{
    place.find({tags: req.params.tag}, (err, place)=>{
        if(err){
            res.status(404).json({message: "Could not find places with that tag."})
        } else {
            res.status(200).json({places: place})
        }
    })
})

router.get("/city/:city", (req, res)=>{
    const city = req.params.city
    place.find({
        "location.city": city
    }, (err, place)=>{
        if(err){
            res.status(404).json({message: "Could not find places within that city."})
        } else {
            res.status(200).json({places: place})
        }
    })
})

router.get("/state/:state", (req, res)=>{
    const state = req.params.state
    place.find({  
        "location.state": state
    }, (err, place)=>{
        if(err){
            res.status(404).json({message: "Could not find places within that state."})
        } else {
            res.status(200).json({places: place})
        }
    })
})



router.delete('/delete/:placeId', (req, res) => {
    place.deleteOne({ 
        _id: req.params.placeId 
    }, (error, deletedPlace) => {
        if (error) {
            console.error("Could not find place to delete."); 
            res.status(404).json({
                error: 'No place found to delete with that id'
            })
        } else {      
            user.updateMany({
                $in: {
                    _id: deletedPlace.favorites
                }
            }, {
                $pull: {
                favorites: req.params.placeId
                }
            }, (error, updatedUser) => {
                if (error) {
                    console.error('Error. No places to delete in user favorites.');
                    res.status(404).json({
                    error: 'Error. No places to delete in user favorites.'
                    })
                } else {
                    review.deleteMany ({
                        place: req.params.placeId
                    }, (error, deletedReview) => {
                        if (error) {
                            console.error("Could not find review to delete."); 
                            res.status(404).json({
                                error: 'No review found to delete with that id'
                            })
                        } else {
                            console.log('Successfully deleted the place, removed it from users favorites, and deleted all reviews pertaining to place.');
                            res.status(204).json ({
                                message: "Place and place data deleted."
                            })
                        }
                    }
                    )
                }
            })
        }
    }
    )
})

router.delete("/all/clear", (req, res)=>{
    place.deleteMany((err)=>{
        if (err) {
            res.status(404).json({message: "Error. Could not delete all places."})
        } else {
            res.status(204).json({message: "Deleted all places."})
        }
    })
})

router.put("/update/:id", (req, res)=>{
    const id = req.params.id
    const updatedPlace = req.body
    place.findByIdAndUpdate(id, updatedPlace, {new: true},(err, updatedPlace)=>{
        if(err){
            res.status(404).json({message: "Place not updated."})
        } else {
            res.status(202).json({message: "Place updated.",
            place: updatedPlace})
        }
    })
})

module.exports = router