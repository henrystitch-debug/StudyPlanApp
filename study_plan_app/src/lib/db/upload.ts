// TODO: durch eine echte Datenbank ersetzen (z.B. db.upload.create/findUnique).
// Bis dahin: In-Memory-Zwischenspeicher, damit saveUpload -> getUploadById
// innerhalb eines laufenden Server-Prozesses tatsächlich funktioniert, statt
// die hochgeladenen Bytes sofort zu verwerfen. Geht bei jedem Server-Neustart
// verloren und wird nicht zwischen mehreren Server-Instanzen geteilt.
type StoredUpload = {
  filename: string;
  mimeType: string;
  data: Buffer;
};

const uploadStore = new Map<number, StoredUpload>();

export async function saveUpload(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // NEU: uploadId (Dummy: aktueller Timestamp), da das Frontend sie braucht,
  // um anschließend /api/summary/summaryCreate mit diesem Upload aufzurufen.
  const uploadId = Date.now();

  uploadStore.set(uploadId, {
    filename: file.name,
    mimeType: file.type,
    data: buffer,
  });

  return { success: true, uploadId };
}

export async function getUploadsByCourseId(courseId: number) {
  //TODO: implement db function to save upload

  return { uploads: ["files"] };
}

export async function getUploadById(uploadId: number) {
  // GEÄNDERT: liest jetzt tatsächlich aus dem In-Memory-Store statt immer eine
  // leere Dummy-Datei zurückzugeben. Gibt es keinen Eintrag, kommt undefined
  // zurück, sodass die Route sauber mit 404 antworten kann.
  const upload = uploadStore.get(uploadId);

  if (!upload) {
    return undefined;
  }

  return { data: upload };
}
