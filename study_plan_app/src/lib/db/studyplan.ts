import { Studyplan } from "@/src/types/studyplan";

export async function getStudyplanById(courseId: number){

    //TODO: fetch summary titles from db
    return {};
}

export async function saveStudyplan(courseId: number, studyplan: Studyplan){

    //TODO: save studyplan to db
    //TODO: studyplanId = 0 wird mitgeschickt -> muss in db neu generiert werden
    
    return {success: true};
}