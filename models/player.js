import mongoose from "mongoose";

const playerSchema = mongoose.Schema(
    {
        playerName: {
            type: String,
            required: [true, "player name required"],
        },
        flag: {
            type: String,
            required: [true, "flag required"],
        },
        gender: {
            type: String, // men women underdog
            required: [true, "gender not found"],
        },
        type: {
            type: String, // bat bowl all
            required: [true, "type required"],
        },
        basePrice: {
            type: Number,
            required: [true, "base price required"],
        },
        overall: {
            type: Number,
            required: [true, "overall required"],
        },
        bat_ppl: {
            type: Number,
            require: [true, "bat_ppl required"],
            min: 0,
            max: 10,
        },
        bow_ppl: {
            type: Number,
            require: [true, "bow_ppl required"],
            min: 0,
            max: 10,
        },
        bat_mo: {
            type: Number,
            require: [true, "bat_mo required"],
            min: 0,
            max: 10,
        },
        bow_mo: {
            type: Number,
            require: [true, "bow_mo required"],
            min: 0,
            max: 10,
        },
        bat_dth: {
            type: Number,
            require: [true, "bat_dth required"],
            min: 0,
            max: 10,
        },
        bow_dth: {
            type: Number,
            require: [true, "bow_dth required"],
            min: 0,
            max: 10,
        },
        playerChemistry: {
            type: Number,
        },
        RTM: {
            type: String,
        },
        Elite: {
            type: String,
        },
        captaincyRating: {
            type: Number,
        },
        underdogPts: {
            type: Number,
        },
        isSold: {
            type: [
                {
                    slot: { type: Number },
                    budget: { type: Number },
                },
            ],
            default: [],
        },
    },
    { collection: "Player" }
);

const Players = mongoose.model("Players", playerSchema);

export default Players;
