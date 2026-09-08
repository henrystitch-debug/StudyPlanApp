import { QuizItemsQA } from "@/src/types/quizItem";
import { QuizItemsMCQ } from "@/src/types/quizItem";

export async function getQuizItemById(uploadId: number, quiztype: string, quizItemId: number){

    //TODO: fetch flashcard from db
    return ["", ""];
}

export async function getQuizItemsOfCourse(courseId: number, type: string){

    //TODO: fetch all flashcards from a specific course
    return {};
}

export async function saveQuizItems(flashcards: QuizItemsQA, mcq: QuizItemsMCQ, freeText: QuizItemsQA){

    //TODO: save all quizitem to db
    return {};
}