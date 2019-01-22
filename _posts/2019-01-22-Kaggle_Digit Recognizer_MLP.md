---
layout: post
title: Kaggle-Digit Recognizer-MLP
date: 2019-01-22 23:25:24.000000000 +09:00
tags: Kaggle; Digit Recognizer; MLP
---
> [参考网页](https://www.kaggle.com/fchollet/simple-deep-mlp-with-keras/code)

```python
from keras.models import Sequential
from keras.utils import np_utils
from keras.layers.core import Dense, Activation, Dropout

import pandas as pd
import numpy as np

# Read data
train = pd.read_csv('../input/train.csv')
labels = train.ix[:,0].values.astype('int32')
X_train = (train.ix[:,1:].values).astype('float32')
X_test = (pd.read_csv('../input/test.csv').values).astype('float32')
```

    Using TensorFlow backend.
    /usr/local/lib/python3.5/dist-packages/ipykernel_launcher.py:10: DeprecationWarning: 
    .ix is deprecated. Please use
    .loc for label based indexing or
    .iloc for positional indexing
    
    See the documentation here:
    http://pandas.pydata.org/pandas-docs/stable/indexing.html#ix-indexer-is-deprecated
      # Remove the CWD from sys.path while we load stuff.
    /usr/local/lib/python3.5/dist-packages/ipykernel_launcher.py:11: DeprecationWarning: 
    .ix is deprecated. Please use
    .loc for label based indexing or
    .iloc for positional indexing
    
    See the documentation here:
    http://pandas.pydata.org/pandas-docs/stable/indexing.html#ix-indexer-is-deprecated
      # This is added back by InteractiveShellApp.init_path()



```python
# convert list of labels to binary class matrix
y_train = np_utils.to_categorical(labels)
```


```python
# pre-processing: divide by max and substract mean
scale = np.max(X_train)
X_train /= scale
X_test /= scale

mean = np.std(X_train)
X_train -= mean
X_test -= mean

input_dim = X_train.shape[1]
nb_classes = y_train.shape[1]
```


```python
# Here's a Deep Dumb MLP (DDMLP)
model = Sequential()
model.add(Dense(128, input_dim=input_dim))
model.add(Activation('relu'))
model.add(Dropout(0.15))
model.add(Dense(128))
model.add(Activation('relu'))
model.add(Dropout(0.15))
model.add(Dense(nb_classes))
model.add(Activation('softmax'))
```


```python
# We'll use categorical xent for the loss, and RMSprop as the optimizer
model.compile(loss='categorical_crossentropy', optimizer='rmsprop')

print("Training...")
model.fit(X_train, y_train, epochs=10, batch_size=16, validation_split=0.1, verbose=2)

print("Generating test predictions...")
preds = model.predict_classes(X_test, verbose=0)

def write_preds(preds, fname):
    pd.DataFrame({"ImageId":list(range(1, len(preds)+1)), "Label": preds}).to_csv(fname, index=False, header=True)
    
write_preds(preds, "keras-mlp.csv")
```

    Training...
    Train on 37800 samples, validate on 4200 samples
    Epoch 1/10
     - 24s - loss: 0.3679 - val_loss: 0.2058
    Epoch 2/10
     - 15s - loss: 0.2157 - val_loss: 0.1467
    Epoch 3/10
     - 20s - loss: 0.1933 - val_loss: 0.1564
    Epoch 4/10
     - 19s - loss: 0.1848 - val_loss: 0.1784
    Epoch 5/10
     - 14s - loss: 0.1876 - val_loss: 0.1773
    Epoch 6/10
     - 14s - loss: 0.1834 - val_loss: 0.1741
    Epoch 7/10
     - 14s - loss: 0.1939 - val_loss: 0.1845
    Epoch 8/10
     - 14s - loss: 0.1859 - val_loss: 0.1918
    Epoch 9/10
     - 14s - loss: 0.1914 - val_loss: 0.2041
    Epoch 10/10
     - 14s - loss: 0.2000 - val_loss: 0.2004
    Generating test predictions...

