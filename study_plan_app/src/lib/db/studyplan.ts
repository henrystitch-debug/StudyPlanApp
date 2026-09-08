import { AiStudyplanResponse } from "@/types/studyplan";

export async function getStudyplanById(courseId: number){

    //TODO: fetch summary titles from db
    return {};
}

export async function saveStudyplan(courseId: number, studyplan: AiStudyplanResponse){

    //TODO: save studyplan to db
    //TODO: studyplanId muss für alle (derselbe) generiert werden!! aktuell gibt es das Feld nicht
    
    return {success: true};
}