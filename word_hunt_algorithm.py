import random

# Load the dictionary from the file
with open('englishwords.txt') as word_file:
    all_english_words = set(word.strip() for word in word_file.read().split())

# Verify the dictionary is loaded correctly
print("Length of dictionary:", len(all_english_words))
sample_words = list(all_english_words)[:10]  # Print first 10 words to verify

# Common letters and their weights
common_letters = 'ETAOINSHRDLUCMWFGYPBVKJXQZ'

ten_letter_words = [word for word in all_english_words if len(word) == 10]

# Verify the dictionary and 10-letter words
print("Number of 10-letter words:", len(ten_letter_words))
sample_words = ten_letter_words[:10]  # Print first 10 words to verify
print("Sample 10-letter words from dictionary:", sample_words)


weights = {
    'E': 13, 'T': 9, 'A': 8, 'O': 8, 'I': 7, 'N': 7, 'S': 6, 'H': 6, 'R': 6,
    'D': 4, 'L': 4, 'U': 3, 'C': 3, 'M': 3, 'W': 2, 'F': 2, 'G': 2, 'Y': 2,
    'P': 2, 'B': 1, 'V': 1, 'K': 1, 'J': 1, 'X': 1, 'Q': 1, 'Z': 1
}

weighted_letters = [letter for letter, weight in weights.items() for _ in range(weight)]


def generate_board():
    board = [['' for _ in range(4)] for _ in range(4)]

    # Insert random 10-letter word if it fits
    if ten_letter_words:
        word = random.choice(ten_letter_words)
        print(f"Inserting word: {word}")

        directions = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

        # Start from a random position
        row, col = random.randint(0, 3), random.randint(0, 3)
        board[row][col] = word[0]
        used_positions = [(row, col)]

        for letter in word[1:]:
            possible_moves = []
            for dr, dc in directions:
                new_row, new_col = row + dr, col + dc
                if 0 <= new_row < 4 and 0 <= new_col < 4 and board[new_row][new_col] == '':
                    possible_moves.append((new_row, new_col))

            if not possible_moves:
                print("Failed to place the word.")
                return generate_board()  # Retry if the word cannot be placed

            row, col = random.choice(possible_moves)
            board[row][col] = letter
            used_positions.append((row, col))

    # Fill the rest of the board with random letters
    for i in range(4):
        for j in range(4):
            if board[i][j] == '':
                board[i][j] = random.choice(weighted_letters)

    return board
board = generate_board()
print("Generated board:")
for row in board:
    print(row)

valid_words = []

def get_neighbors(i, j):
    neighbors = [
        (i + x, j + y)
        for x in range(-1, 2)
        for y in range(-1, 2)
        if (x != 0 or y != 0) and 0 <= i + x < len(board) and 0 <= j + y < len(board[0])
    ]
    return neighbors

def is_valid_word(word):
    return word in all_english_words

def find_words_from_position(i, j, current_word, visited):
    if len(current_word) == 10:
        return

    current_word += board[i][j]
    visited.add((i, j))

    # Debugging: Print each word being checked
    # print(f"Checking word: {current_word}")

    if is_valid_word(current_word) and current_word not in valid_words:
        valid_words.append(current_word)

    for neighbor in get_neighbors(i, j):
        if neighbor not in visited:
            find_words_from_position(neighbor[0], neighbor[1], current_word, visited)

    visited.remove((i, j))

def find_all_valid_words():
    for i in range(len(board)):
        for j in range(len(board[0])):
            find_words_from_position(i, j, '', set())

find_all_valid_words()
print("Valid words found:")
print(valid_words)
print("Total valid words:", len(valid_words))


def calculate_score(words):
    score = 0
    scoring_table = {
        1: 0,
        2: 0,
        3: 100,
        4: 400,
        5: 800,
        6: 1400,
        7: 1800,
        8: 2200,
        9: 2600
    }

    for word in words:
        length = len(word)
        if length > 9:
            score += 2600  # Max score for lengths greater than 9
        else:
            score += scoring_table.get(length, 0)

    return score



print("Total score:", calculate_score(valid_words))