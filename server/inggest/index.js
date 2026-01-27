import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "pingup-app" });

// Inngest fucntion to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event}) => {
    const {id, first_name, last_name, email_addresses, image_url} = event.data;
    let username = email_addresses[0].email_address.split("@")[0];

    // check if user already exists in the database
    const userExists = await User.findOne({username})

    if(userExists){
        username = username + Math.floor(Math.random() * 10000);
    }

    const userData = {
        _id: id,
        email: email_addresses[0].email_address,
        full_name: first_name + ' ' + last_name,
        username: username,
        profile_picture: image_url,
    }

    // Save user to the database
    await User.create(userData);
  },
);

// Inggest function to update user data in the database
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event}) => {
    const {id, first_name, last_name, email_addresses, image_url} = event.data;

    const updatedData = {
        email: email_addresses[0].email_address,
        full_name: first_name + ' ' + last_name,
        profile_picture: image_url,
    }

    await User.findByIdAndUpdate(id, updatedData);


  },
);

// Inggest function to delete user data in the database
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event}) => {
    const {id} = event.data;

    await User.findByIdAndDelete(id);



  },
);



// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
];