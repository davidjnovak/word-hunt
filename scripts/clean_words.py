def clean_words():
    with open('./englishwords.txt', 'r') as f:
        words = f.readlines()
        print (len(words))

    with open('./englishwordsv1.txt', 'w') as f:
        for word in words:
            if len(word) > 3:
                f.write(word)

clean_words()