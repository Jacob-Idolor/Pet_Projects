from ml_prediction_service import logistic_train, logistic_predict


def test_logistic_train_predict_shape():
    X = [[0], [1], [2], [3]]
    y = [0, 0, 1, 1]
    weights, bias = logistic_train(X, y, epochs=50, lr=0.1)
    preds = logistic_predict(X, weights, bias)
    assert len(preds) == 4
    assert all(0 <= p <= 1 for p in preds)
