const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const lodash = require("lodash");
require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const username = process.env.USER_NAME;
const password = process.env.PASSWORD;

mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.yqjuvgc.mongodb.net/todolistDB`, { useNewUrlParser: true });

const itemSchema = {
    name: {
        type: String,
        required: true
    }
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item ({
    name: "Welcome to your todoList!"
});

const item2 = new Item ({
    name: "Hit the + button to add a new item."
});

const item3 = new Item ({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name: String,
    items: [itemSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    
    Item.find().then(function(foundItems){
        if(foundItems.length === 0) {
            Item.insertMany(defaultItems).then(function(){
                console.log("Items inserted Successfully");
            }).catch(function(err){
                console.log(err);
            });
            res.redirect("/");
        }else{
            res.render("list", {listTitle: "Today", newListItems: foundItems});
        }
    }).catch(function(err){
        console.log(err);
    });

});

app.post("/", function(req, res){ 
    
    const itemName = req.body.newItem;
    const listName = req.body.list;
    
    const item = new Item ({
        name: itemName
    })
    
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else{
        List.findOne({name: listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
    
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId).then(function(){
            console.log("Item deleted Successfully");
            res.redirect("/");
        }).catch(function(err){
            console.log(err);
        })
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(foundList){
            res.redirect("/" + listName);
        }).catch(function(err){
            console.log(err);
        });
    }
});

app.get("/:customListName", function(req, res){
    let customListName = lodash.capitalize(req.params.customListName);
    
    List.findOne({name: customListName}).then(function(foundList){
        if(!foundList){
            // Create a new List
            const list = new List ({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        }else{
            // Show an existing List 
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items}); 
        }
    }).catch(function(err){
        console.log(err);
    });
});

app.get("/about", function(req, res) {
    res.render("about");
});

const portUsed = process.env.PORT || 3000; 

app.listen(portUsed, () => {
    console.log(`server is running on port ${portUsed}`);
});