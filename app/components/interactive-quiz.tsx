"use client";

import { useMemo, useState } from "react";

export type QuizChoice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  explanation?: string;
};

export type QuizActivityInit = {
  eventType: "activity-init";
  type: "quiz";
  activityId: string;
  title: string;
  instructions?: string;
  questions: QuizQuestion[];
};

export type QuizAnswerResult = {
  questionId: string;
  selectedChoiceId: string | null;
  correctChoiceId: string | null;
  isCorrect: boolean;
};

export type QuizActivityEnd = {
  eventType: "activity-end";
  type: "quiz";
  activityId: string;
  title: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
  answers: QuizAnswerResult[];
};

type InteractiveQuizProps = {
  quiz: QuizActivityInit;
  onComplete: (result: QuizActivityEnd) => void;
};

export function InteractiveQuiz({ quiz, onComplete }: InteractiveQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<
    Record<string, string>
  >({});
  const [result, setResult] = useState<QuizActivityEnd | null>(null);

  const total = quiz.questions.length;
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const selectedChoiceId = currentQuestion
    ? selectedChoices[currentQuestion.id]
    : undefined;
  const correctChoice = currentQuestion?.choices.find(
    (choice) => choice.isCorrect,
  );
  const hasAnsweredCurrent = Boolean(selectedChoiceId);
  const currentAnswerIsCorrect =
    hasAnsweredCurrent && selectedChoiceId === correctChoice?.id;
  const answeredCount = useMemo(
    () =>
      quiz.questions.filter((question) => selectedChoices[question.id]).length,
    [quiz.questions, selectedChoices],
  );
  const isLastQuestion = currentQuestionIndex === total - 1;

  const completeQuiz = (answersByQuestion: Record<string, string>) => {
    const answers = quiz.questions.map((question) => {
      const selectedQuestionChoiceId = answersByQuestion[question.id] ?? null;
      const correctQuestionChoice = question.choices.find(
        (choice) => choice.isCorrect,
      );

      return {
        questionId: question.id,
        selectedChoiceId: selectedQuestionChoiceId,
        correctChoiceId: correctQuestionChoice?.id ?? null,
        isCorrect: Boolean(
          selectedQuestionChoiceId &&
            correctQuestionChoice?.id === selectedQuestionChoiceId,
        ),
      };
    });

    const score = answers.filter((answer) => answer.isCorrect).length;
    const completedQuiz: QuizActivityEnd = {
      eventType: "activity-end",
      type: "quiz",
      activityId: quiz.activityId,
      title: quiz.title,
      score,
      total,
      percentage: total === 0 ? 0 : Math.round((score / total) * 100),
      completedAt: new Date().toISOString(),
      answers,
    };

    setResult(completedQuiz);
    onComplete(completedQuiz);
  };

  const selectChoice = (choiceId: string) => {
    if (!currentQuestion || selectedChoiceId || result) {
      return;
    }

    const updatedChoices = {
      ...selectedChoices,
      [currentQuestion.id]: choiceId,
    };

    setSelectedChoices(updatedChoices);

    if (isLastQuestion) {
      completeQuiz(updatedChoices);
    }
  };

  const goToNextQuestion = () => {
    if (!hasAnsweredCurrent || isLastQuestion) {
      return;
    }

    setCurrentQuestionIndex((index) => index + 1);
  };

  if (!currentQuestion) {
    return (
      <div className="my-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        This quiz does not contain any questions.
      </div>
    );
  }

  return (
    <div className="my-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Quiz
          </div>
          <div className="text-xs font-medium text-zinc-500">
            {Math.min(answeredCount + 1, total)} of {total}
          </div>
        </div>
        <h2 className="mt-1 text-lg font-semibold text-zinc-950">
          {quiz.title}
        </h2>
        {quiz.instructions ? (
          <p className="mt-1 text-sm text-zinc-600">{quiz.instructions}</p>
        ) : null}
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-950 transition-all"
          style={{
            width: `${total === 0 ? 0 : (answeredCount / total) * 100}%`,
          }}
        />
      </div>

      <fieldset className="rounded-md border border-zinc-200 p-3">
        <legend className="px-1 text-sm font-medium text-zinc-950">
          {currentQuestionIndex + 1}. {currentQuestion.prompt}
        </legend>

        <div className="mt-3 space-y-2">
          {currentQuestion.choices.map((choice) => {
            const isSelected = selectedChoiceId === choice.id;
            const showCorrect = hasAnsweredCurrent && choice.isCorrect;
            const showIncorrect =
              hasAnsweredCurrent && isSelected && !choice.isCorrect;

            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => selectChoice(choice.id)}
                disabled={hasAnsweredCurrent || Boolean(result)}
                className={[
                  "flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition",
                  showCorrect
                    ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                    : showIncorrect
                      ? "border-rose-300 bg-rose-50 text-rose-950"
                      : isSelected
                        ? "border-zinc-900 bg-zinc-50 text-zinc-950"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 disabled:hover:border-zinc-200",
                  hasAnsweredCurrent ? "cursor-default" : "cursor-pointer",
                ].join(" ")}
              >
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                  {showCorrect ? "✓" : showIncorrect ? "×" : ""}
                </span>
                <span>{choice.text}</span>
              </button>
            );
          })}
        </div>

        {hasAnsweredCurrent ? (
          <div
            className={[
              "mt-3 rounded-md border p-3 text-sm",
              currentAnswerIsCorrect
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-rose-200 bg-rose-50 text-rose-950",
            ].join(" ")}
          >
            <div className="font-medium">
              {currentAnswerIsCorrect ? "Correct" : "Not quite"}
            </div>
            {currentQuestion.explanation ? (
              <p className="mt-1">{currentQuestion.explanation}</p>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-sm text-zinc-600">
          {result
            ? `${result.score}/${result.total} correct (${result.percentage}%)`
            : `${answeredCount}/${total} answered`}
        </div>

        {!result && !isLastQuestion ? (
          <button
            type="button"
            onClick={goToNextQuestion}
            disabled={!hasAnsweredCurrent}
            className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Next
          </button>
        ) : !result && isLastQuestion ? (
          <span className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-600">
            Answer to finish
          </span>
        ) : result ? (
          <span className="rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-900">
            Finished
          </span>
        ) : null}
      </div>

      {result ? (
        <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
          <span className="font-medium text-zinc-950">Final score:</span>{" "}
          {result.score}/{result.total} correct ({result.percentage}%)
        </div>
      ) : null}
    </div>
  );
}
