# flask app for embedding service
# File: src/backend/nlp-embedding/embedding_service.py in nlpenv
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer

app = Flask(__name__) # Initialize the model. This will load the model into memory.
model = SentenceTransformer('all-MiniLM-L6-v2')  # Fast and good

@app.route('/embed', methods=['POST']) # Define the endpoint for embedding
def embed():
    # Get the JSON data from the request
    data = request.json
    texts = data.get('texts', []) # Extract the texts from the JSON data
    if not texts: # Check if texts are provided
        return jsonify({'error': 'No texts provided'}), 400 # Return error if no texts are provided

    embeddings = model.encode(texts).tolist() # Generate embeddings for the texts
    return jsonify({'embeddings': embeddings}) # Return the embeddings as JSON

if __name__ == '__main__':
    app.run(port=5001) # Run the Flask app on port 5001
