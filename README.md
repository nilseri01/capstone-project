Capstone Project

You upload file and watermark label at once.
As soon as DB save is called, SNS creation is performed for ES indexing.
As soon as S3 save is performed, SNS creation is performed for watermark process. Here another SNS creation is triggered for DB update (uploadUrl as watermarked thumbnail image and processed is set true and also processedDate is set as now) and ES update (same fields are added as DB update)
If an item is deleted, another SNS creation is performed to delete both image and thumbnail from their S3 buckets and also to delete ES doc for that item.

Sample project for watermark https://medium.com/@rossbulat/image-processing-in-nodejs-with-jimp-174f39336153