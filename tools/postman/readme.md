# Podkrepi.bg postman collection

## Getting started

- Get the postman app 
- Import the collection ![import image missing](./import.png)
- Create an environment and add your username and password *ensure the password is a **secret** ![create an environment image missing](./env_demo.png)
- Get the tokens via the `get token` request (it will use the postman env variables from previous step and store a access_token in postman global variables) ![authenticate image missing](./get_tokens.png)

Done - now you can make authenticated requests: ![example for authenticated request](./user_donations_example.png)

## Contributing to the collection

The way to contribute is edit in a postman editor and then export it (Postman stores the collections in a db somewhere and there's no trivial way to have it store it where we need it - in the repo)

- Edit in postman 

![add new image missing](./add_new_via_duplicate.png)

![edit](./user_donations_example.png)

- Export and overwrite in the repo
![export overwrite](./export.png)
