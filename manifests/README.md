# Deployment
To deploy the module make sure you do the following:
- Have a schema `api` created in the database to be used by the module
- Set the database URL to the correct value. Run `echo -n url | base64` and paste the output in the `db-secret.yaml`
- Update the container versions in `api-headless.yaml`
- Verify the database endpoint configuration

After that run:
```bash
kubectl create namespace podkrepi-api
kubectl apply -f db-secret.yaml
kubectl apply -f api-headless.yaml
```