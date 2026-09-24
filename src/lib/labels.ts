// Display names only; corpus category keys and saved progress stay unchanged.
export const topicNames: Record<string, string> = {
  Greetings: '打个招呼', Food: '吃饭喝水', Travel: '出门在外', Home: '家里家外',
  Time: '时间安排', Shopping: '买点东西', Study: '学习日常', People: '身边的人',
  Feelings: '心情感受', City: '城市生活', Nature: '自然天气', Hobbies: '兴趣爱好'
};
export const topicName = (key: string) => topicNames[key] || key;
