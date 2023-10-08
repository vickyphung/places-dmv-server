require('dotenv').config()
const express = require("express");
const router = express.Router();
// const User = require("../models/user");
const axios = require('axios');

const textSearch = "https://maps.googleapis.com/maps/api/place/textsearch/json?"
// &location=38N,78W

const textQuery = async (query) => {
    const response = await axios.get(`${textSearch}query=${query}&key=${process.env.GOOGLE_API_KEY}`);
    return response.data;
}
router.get('/textSearch/:query', async (req, res) => {
    const returnedData = await textQuery(req.params.query);
    console.log(returnedData);
    res.send(returnedData);
});


const findPlace = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
const locationBias = "ipbias"
//other locationBias option:
    // circle:radius@lat,lng
    //radius in meters
const fields ="formatted_address,geometry,name,photo,place_id,type"

const findPlaceFromText = async (input) => {
    const response = await axios.get(`${findPlace}?inputtype=textquery&fields=${fields}&locationbias=${locationBias}&input=${input}&key=${process.env.GOOGLE_API_KEY}`);
    return response.data;
}

router.get('/findPlace/:input', async (req, res) => {
    const returnedData = await findPlaceFromText(req.params.input);
    console.log(returnedData);
    res.send(returnedData);
  });


//Place Details request, using place_id from search results (from textQuery search and findPlaceFromText search)
const details = "https://maps.googleapis.com/maps/api/place/details/json?"

const placeDetails = async (placeId) => {
    const response = await axios.get(`${details}place_id=${placeId}&key=${process.env.GOOGLE_API_KEY}`);
    return response.data;
}

router.get('/details/:placeId', async (req, res) => {
    const returnedData = await placeDetails(req.params.placeId);
    console.log(returnedData);
    res.send(returnedData);
  });


//Get Photos for a Place, using photo reference from place details request
const photo = "https://maps.googleapis.com/maps/api/place/photo"
const maxWidth = "400"

const placePhoto = async (photoRef) => {
    const response = await axios.get(`${photo}?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${process.env.GOOGLE_API_KEY}`);
    return response.data;
}

router.get('/photo/:photoRef', async (req, res) => {
    const returnedData = await placePhoto(req.params.photoRef);
    console.log(returnedData);
    res.send(returnedData);
});


module.exports = router;
