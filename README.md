## Capstone Project

This is a serverless web project where you can upload your images to watermark them with the text you provide (max 30 length).
After the image is processed, it will be resized and watermarked (Font color is white for watermarking, so please prefer dark colored images to see the effect. The text will appear in the middle of the bottom of the image).

When you first login from web (Auth0), all your images will be displayed (by querying the DynamoDB table).
You can search with watermark text as your key; here an ElasticSearch query will be performed for matching watermark values (exact text match).
To reset your search, you can click "Load All" button (data will be drawn from DB again).

You can upload an image from your computer and provide a watermark text as a parameter. After validating the inputs (on both FE and BE side), the image will be queued for processing. You will see the unprocessed version as soon as you upload (processed = false) on the web page. When you do a refresh by clicking "Load All" button, you can see your image process info (check if processed = true). You can click on image name to download it.

When you click "Save", both DB and S3 (bucket=image) save operations are performed. SNS creation is performed for ES indexing.
As soon as S3 save (bucket=image) is performed, SNS creation is triggered for watermarking process. 
In watermarking step, the image is resized, watermarked and then uploaded to S3 (bucket=thumbnail). Also a DB update is performed (uploadUrl is set as watermarked thumbnail image, processed is set true and processDate is set as now date).
As soon as S3 save (bucket=thumbnail) is performed, another SNS creation is triggered for ES update (same fields are updated as in DB update).
When you click delete icon next to the image, item record will be deleted from DB and the related images (image and watermarked thumbnail) will be deleted from S3 buckets and also SNS creation is triggered to delete ES doc for that item.

Backend API list is provided in a Postman Collection, you can download here => https://github.com/nilseri01/capstone-project/raw/master/other/postman/Udacity_Capstone_Project.postman_collection.json  
apiId is <b>402wwyptb5</b> for the project

**Note: Example code from a sample project was used for watermarking => https://medium.com/@rossbulat/image-processing-in-nodejs-with-jimp-174f39336153

### Screenshot:
![web page](https://github.com/nilseri01/capstone-project/raw/master/other/screenshots/screenshot.png)