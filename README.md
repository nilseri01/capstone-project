## Capstone Project

This is a serverless web project where you can upload to watermark your images with the text you provide (max 30 length).
After the image is processed, it will be resized and watermarked (font color is white for watermarking, so please prefer dark colored images to see the effect. the text will appear in the middle of the bottom of the image)

When you first login from web (Auth0), all your images will be displayed (by querying the DynamoDB table).
You can search with watermark text as your key; here an ElasticSearch query will be performed for matching watermark values.
To reset your search, you can click "Load All" button (data will be drawn from DB).

You can upload an image from your computer and provide a watermark text as a parameter. After validating the inputs (from both FE and BE side), the image will be queued for processing. You will see the unprocessed version as soon as you upload (processed = false). When you do a refresh by clicking "Load All" button, you can see your image process info (check if processed = true). You can click on image name to download it.

When you click "Save", both DB and S3 (bucket=image) save operations are performed. DB save is called and SNS creation is performed for ES indexing.
As soon as S3 save (bucket=image) is called, SNS creation is triggered for watermarking process. 
In watermarking step, the image is resized and watermarked and then uploaded to S3 (bucket=thumbnail). Also a DB update is performed (uploadUrl as watermarked thumbnail image and processed is set true and also processDate is set as now date).
As soon as S3 save (bucket=thumbnail) is called, another SNS creation is triggered for ES update (same fields are updated as in DB update).

When you click delete icon next to the image, the related images (image and watermarked thumbnail) will be deleted from DB and S3 buckets and SNS creation is triggered to delete ES doc for that item.


**Note: Example code from a sample project was used for watermarking => https://medium.com/@rossbulat/image-processing-in-nodejs-with-jimp-174f39336153

Backend API list is provided in Postman Collection, provided here => 

### Screenshot:
![web page](https://github.com/nilseri01/capstone-project/raw/master/other/screenshots/screenshot.png)