

function uploadToDb({}){};

export async function saveUpload(file: File){
 //TODO: implement db function to save upload

 const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const upload = await uploadToDb({ //db.upload.create({})
    data: {
      filename: file.name,
      mimeType: file.type,
      data: buffer, // die eigentlichen Datei-Bytes werden in der DB gespeichert
    },
  });

 // NEU: uploadId ergänzt (Dummy: aktueller Timestamp), da das Frontend sie braucht,
 // um anschließend /api/summary/summaryCreate mit diesem Upload aufzurufen.
 return {success: true, uploadId: Date.now()};
}

export async function getUploadsByCourseId(courseId: number){
    //TODO: implement db function to save upload

 return {uploads: ["files"]};
}

export async function getUploadById(uploadId: number){

    //TODO: implement db function to get upload
    return {data: {
        filename: "",
        mimeType: "",
        data: ""
    }};
}