const express = require('express');
const router = express.Router();
const review = require('../models/review');
const place = require('../models/place');
const user = require('../models/user');

// const bcrypt = require('bcrypt');
// const saltRounds = process.env.SALT_ROUNDS;
// const jwtSecret = process.env.JWT_SECRET;
// const jwt = require('jwt-simple');
// const { validate, login } = require('../middlewares');


router.post('/', (req, res) => {
  // sets the body to a variable
  const reviewData = req.body;
  review.create(reviewData, (error, createdReview) => {
    if (error) {
      res.status(400).json({
        error: 'Error. Could not create review.'
      })
    } else {
        user.updateOne({
            _id: reviewData.user
        }, {
            $push: {
            reviews: createdReview._id
            }
        }, (error, updatedUser) => {
            if (error) {
                console.error(error);
                res.status(404).json({ 
                    error: 'No user to add review to.'
                });
            } else {
                place.updateOne({ 
                    _id: reviewData.place
                }, { 
                    $push: {
                        reviews: {
                            _id: createdReview._id
                        }
                    }
               }, (error, updatedReview) => {
                    if (error) {
                        console.error("Review and place not updated.");
                        res.status(400).json({ 
                            error: 'Review and place not updated.'
                        });
                    } else {
                        console.log('Successfully created review and added it to place data');
                        res.status(201).json({
                            message: 'Successfully created review!',
                            review: createdReview
                        });
                    }
                }
                );
            }
        });
    }
  })
});

router.get("/", (req, res)=>{
    review.find()
        .populate("place", 'name')
        .populate("user", 'name')
        .sort({"createdAt": -1})
        .exec
    ((err, allReviews)=>{
        if(err){
            res.status(404).json({message: "Error. No reviews found."})
        } else {
            res.status(200).json({
            reviews: allReviews})
        }
    })
})

router.get("/place/:placeId", (req, res)=>{
    // const placeReviewed = req.params.placeId
    review.find({place: req.params.placeId}, (err, review)=>{
        if(err){
            res.status(404).json({message: "Could not find reviews for the place with that ID."})
        } else {
            res.status(200).json({reviews: review})
        }
    })
})

router.get("/id/:reviewId", (req, res)=>{
    // const placeReviewed = req.params.placeId
    review.find({_id: req.params.reviewId}, (err, review)=>{
        if(err){
            res.status(404).json({message: "Could not find reviews for the place with that ID."})
        } else {
            res.status(200).json({reviews: review})
        }
    })
})


router.put("/update/:reviewId", (req, res)=>{
    const id = req.params.reviewId
    const updatedReview = req.body
    review.findByIdAndUpdate(id, updatedReview, {new: true},(err, updatedReview)=>{
        if(err){
            res.status(404).json({message: "Review not updated."})
        } else {
            res.status(202).json({message: "Review updated.",
            place: updatedReview})
        }
    })
})

router.delete('/delete/:reviewId', (req, res) => {
    review.deleteOne({ 
        _id: req.params.reviewId 
    }, (error, deletedReview) => {
        if (error) {
            console.error("Could not find review to delete."); 
            res.status(404).json({
                error: 'No review with that id found to delete.'
            })
        } else {      
            user.updateMany({
                $in: {
                    _id: deletedReview.reviews
                }
            }, {
                $pull: {
                reviews: req.params.reviewId
                }
            }, (error, updatedUser) => {
                if (error) {
                    console.error(error);
                    res.status(404).json({ 
                        error: 'No user to remove review from.'
                    });
                } else {
                    place.updateMany({
                        $in: {
                            _id: deletedReview.reviews
                        }
                    }, {
                        $pull: {
                        reviews: req.params.reviewId
                        }
                    }, (error, updatedPlace) => {
                        if (error) {
                            console.error("Review not removed from place");
                            res.status(400).json({ 
                                error: 'Review not removed and place not updated.'
                            });
                        } else {
                            console.log('Successfully deleted the review, removed it from user\'s reviews, and deleted review from place.');
                            res.status(204).json ({
                                message: "Review and review data deleted."
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
    review.deleteMany((err)=>{
        if (err) {
            res.status(404).json({message: "All reviews could not be deleted."})
        } else {
            res.status(204).json({message: "Deleted all reviews."})
        }
    })
})

module.exports = router