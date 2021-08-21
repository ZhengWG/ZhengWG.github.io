---
layout: post
title: Keras样例练习
date: 2019-02-23 22:25:24.000000000 +09:00
categories: [Tutorial]
tags: [Keras, Tensorflow]
---
# Keras应用实例

参考自 [keras_team](https://github.com/keras-team/keras/tree/master/examples)

实例包括：图像（视频），文字（序列），生成模型，Keras特色功能实现，这里先简单探讨图像和Keras模型功能部分。

软件环境：
python3.5 tensorflow1.12.0 keras.2.2.4

PS: ipynb格式转markdown格式:
```
jupyter nbconvert --to markdown ****.ipynb
```
## 图像部分

### Minist_MLP


```python
'''
Trains a simple deep NN on the MNIST dataset.
20 epochs
acc: 0.9816
Test loss: 0.11610001068654767
Test accuracy: 0.9816
about 6 seconds per epoch on a GeForce 940M GPU.
'''

from __future__ import print_function

import keras
from keras.datasets import mnist
from keras.models import Sequential
from keras.layers import Dense, Dropout
from keras.optimizers import RMSprop

batch_size = 128
num_classes = 10
epochs = 20

# 将数据集分割为训练集和验证集
(x_train, y_train), (x_test, y_test) = mnist.load_data()

x_train = x_train.reshape(60000, 784)
x_test = x_test.reshape(10000, 784)
x_train = x_train.astype('float32')
x_test = x_test.astype('float32')
x_train /= 255
x_test /= 255
print(x_train.shape[0], 'train samples')
print(x_test.shape[0], 'test samples')

# 类型标签需要转化为keras要求的binary class matrics格式
y_train = keras.utils.to_categorical(y_train, num_classes)
y_test = keras.utils.to_categorical(y_test, num_classes)

model = Sequential()
model.add(Dense(512, activation='relu', input_shape=(784,)))
model.add(Dropout(0.2))
model.add(Dense(512, activation='relu'))
model.add(Dropout(0.2))
model.add(Dense(num_classes, activation='softmax'))

model.summary()

model.compile(loss='categorical_crossentropy',
              optimizer=RMSprop(),
              metrics=['accuracy'])

history = model.fit(x_train, y_train,
                    batch_size=batch_size,
                    epochs=epochs,
                    verbose=1,
                    validation_data=(x_test, y_test))
score = model.evaluate(x_test, y_test, verbose=0)
print('Test loss:', score[0])
print('Test accuracy:', score[1])
```

    Using TensorFlow backend.


    60000 train samples
    10000 test samples
    _________________________________________________________________
    Layer (type)                 Output Shape              Param #
    =================================================================
    dense_1 (Dense)              (None, 512)               401920
    _________________________________________________________________
    dropout_1 (Dropout)          (None, 512)               0
    _________________________________________________________________
    dense_2 (Dense)              (None, 512)               262656
    _________________________________________________________________
    dropout_2 (Dropout)          (None, 512)               0
    _________________________________________________________________
    dense_3 (Dense)              (None, 10)                5130
    =================================================================
    Total params: 669,706
    Trainable params: 669,706
    Non-trainable params: 0
    _________________________________________________________________
    Train on 60000 samples, validate on 10000 samples
    Epoch 1/20
    60000/60000 [==============================] - 17s 289us/step - loss: 0.2419 - acc: 0.9260 - val_loss: 0.1378 - val_acc: 0.9563
    Epoch 2/20
    60000/60000 [==============================] - 6s 108us/step - loss: 0.1039 - acc: 0.9698 - val_loss: 0.0789 - val_acc: 0.9759
    Epoch 3/20
    60000/60000 [==============================] - 6s 108us/step - loss: 0.0743 - acc: 0.9776 - val_loss: 0.0839 - val_acc: 0.9754
    Epoch 4/20
    60000/60000 [==============================] - 7s 117us/step - loss: 0.0597 - acc: 0.9820 - val_loss: 0.0776 - val_acc: 0.9797
    Epoch 5/20
    60000/60000 [==============================] - 7s 110us/step - loss: 0.0494 - acc: 0.9851 - val_loss: 0.0889 - val_acc: 0.9793
    Epoch 6/20
    60000/60000 [==============================] - 7s 110us/step - loss: 0.0437 - acc: 0.9867 - val_loss: 0.0748 - val_acc: 0.9818
    Epoch 7/20
    60000/60000 [==============================] - 7s 111us/step - loss: 0.0399 - acc: 0.9882 - val_loss: 0.0847 - val_acc: 0.9804
    Epoch 8/20
    60000/60000 [==============================] - 7s 113us/step - loss: 0.0333 - acc: 0.9901 - val_loss: 0.0757 - val_acc: 0.9832
    Epoch 9/20
    60000/60000 [==============================] - 7s 112us/step - loss: 0.0312 - acc: 0.9907 - val_loss: 0.0847 - val_acc: 0.9825
    Epoch 10/20
    60000/60000 [==============================] - 7s 114us/step - loss: 0.0283 - acc: 0.9919 - val_loss: 0.0814 - val_acc: 0.9836
    Epoch 11/20
    60000/60000 [==============================] - 7s 113us/step - loss: 0.0253 - acc: 0.9927 - val_loss: 0.0938 - val_acc: 0.9815
    Epoch 12/20
    60000/60000 [==============================] - 7s 113us/step - loss: 0.0255 - acc: 0.9926 - val_loss: 0.0906 - val_acc: 0.9821
    Epoch 13/20
    60000/60000 [==============================] - 7s 112us/step - loss: 0.0211 - acc: 0.9935 - val_loss: 0.1134 - val_acc: 0.9804
    Epoch 14/20
    60000/60000 [==============================] - 7s 114us/step - loss: 0.0224 - acc: 0.9937 - val_loss: 0.0971 - val_acc: 0.9839
    Epoch 15/20
    60000/60000 [==============================] - 7s 121us/step - loss: 0.0237 - acc: 0.9938 - val_loss: 0.0961 - val_acc: 0.9819
    Epoch 16/20
    60000/60000 [==============================] - 7s 110us/step - loss: 0.0192 - acc: 0.9944 - val_loss: 0.1032 - val_acc: 0.9840
    Epoch 17/20
    60000/60000 [==============================] - 7s 120us/step - loss: 0.0202 - acc: 0.9944 - val_loss: 0.1047 - val_acc: 0.9832
    Epoch 18/20
    60000/60000 [==============================] - 7s 121us/step - loss: 0.0180 - acc: 0.9955 - val_loss: 0.1054 - val_acc: 0.9816
    Epoch 19/20
    60000/60000 [==============================] - 7s 113us/step - loss: 0.0192 - acc: 0.9951 - val_loss: 0.1253 - val_acc: 0.9819
    Epoch 20/20
    60000/60000 [==============================] - 7s 114us/step - loss: 0.0189 - acc: 0.9952 - val_loss: 0.1063 - val_acc: 0.9821
    Test loss: 0.10632506377054074
    Test accuracy: 0.9821


## CIFAR10 小图片分类示例（Sequential式）


```python
'''
Trains a simple deep NN on the CIFAR10 dataset.
20 epochs
acc(data auged): 0.6818(train),0.7230(val)
Test loss: 0.8004208864212036
Test accuracy: 0.723
about 77 seconds per epoch on a GeForce 940M GPU.
'''
from __future__ import print_function
import keras
from keras.datasets import cifar10
from keras.preprocessing.image import ImageDataGenerator
from keras.models import Sequential
from keras.layers import Dense, Dropout, Activation, Flatten
from keras.layers import Conv2D, MaxPooling2D

batch_size = 32
num_classes = 10
epochs = 20
# data_augmentation = True
# num_predictions = 20

# 数据载入
(x_train, y_train), (x_test, y_test) = cifar10.load_data()

# 多分类标签生成
y_train = keras.utils.to_categorical(y_train, num_classes)
y_test = keras.utils.to_categorical(y_test, num_classes)

# 网络结构配置
model = Sequential()
model.add(Conv2D(32, (3, 3), padding='same',
                 input_shape=x_train.shape[1:]))
model.add(Activation('relu'))
model.add(Conv2D(32, (3, 3)))
model.add(Activation('relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Dropout(0.25))

model.add(Conv2D(64, (3, 3), padding='same'))
model.add(Activation('relu'))
model.add(Conv2D(64, (3, 3)))
model.add(Activation('relu'))
model.add(MaxPooling2D(pool_size=(2, 2)))
model.add(Dropout(0.25))

model.add(Flatten())
model.add(Dense(512))
model.add(Activation('relu'))
model.add(Dropout(0.5))
model.add(Dense(num_classes))
model.add(Activation('softmax'))

# 训练参数设置
# initiate RMSprop optimizer
opt = keras.optimizers.rmsprop(lr=0.0001, decay=1e-6)

# Let's train the model using RMSprop
model.compile(loss='categorical_crossentropy',
              optimizer=opt,
              metrics=['accuracy'])

# 生成训练数据
x_train = x_train.astype('float32')
x_test = x_test.astype('float32')
x_train /= 255
x_test /= 255

# 无数据增强进行训练
print('Not using data augmentation.')
model.fit(x_train, y_train,
          batch_size=batch_size,
          epochs=epochs,
          validation_data=(x_test, y_test),
          shuffle=True)
```

    Using TensorFlow backend.


    Not using data augmentation.
    Train on 50000 samples, validate on 10000 samples
    Epoch 1/20
    50000/50000 [==============================] - 122s 2ms/step - loss: 1.8311 - acc: 0.3345 - val_loss: 1.6657 - val_acc: 0.4035
    Epoch 2/20
    50000/50000 [==============================] - 111s 2ms/step - loss: 1.5049 - acc: 0.4567 - val_loss: 1.3474 - val_acc: 0.5146
    Epoch 3/20
    50000/50000 [==============================] - 106s 2ms/step - loss: 1.3528 - acc: 0.5153 - val_loss: 1.2531 - val_acc: 0.5597
    Epoch 4/20
    50000/50000 [==============================] - 111s 2ms/step - loss: 1.2483 - acc: 0.5585 - val_loss: 1.1387 - val_acc: 0.5976
    Epoch 5/20
    50000/50000 [==============================] - 103s 2ms/step - loss: 1.1618 - acc: 0.5917 - val_loss: 1.0871 - val_acc: 0.6129
    Epoch 6/20
    50000/50000 [==============================] - 115s 2ms/step - loss: 1.0942 - acc: 0.6180 - val_loss: 1.0086 - val_acc: 0.6451
    Epoch 7/20
    50000/50000 [==============================] - 103s 2ms/step - loss: 1.0383 - acc: 0.6376 - val_loss: 1.0126 - val_acc: 0.6431
    Epoch 8/20
    50000/50000 [==============================] - 104s 2ms/step - loss: 0.9970 - acc: 0.6500 - val_loss: 0.9596 - val_acc: 0.6581
    Epoch 9/20
    50000/50000 [==============================] - 109s 2ms/step - loss: 0.9558 - acc: 0.6686 - val_loss: 0.8889 - val_acc: 0.6854
    Epoch 10/20
    50000/50000 [==============================] - 111s 2ms/step - loss: 0.9255 - acc: 0.6781 - val_loss: 0.8605 - val_acc: 0.6976
    Epoch 11/20
    50000/50000 [==============================] - 111s 2ms/step - loss: 0.8998 - acc: 0.6863 - val_loss: 0.8711 - val_acc: 0.6937
    Epoch 12/20
    50000/50000 [==============================] - 110s 2ms/step - loss: 0.8745 - acc: 0.6970 - val_loss: 0.8339 - val_acc: 0.7066
    Epoch 13/20
    50000/50000 [==============================] - 109s 2ms/step - loss: 0.8500 - acc: 0.7048 - val_loss: 0.8314 - val_acc: 0.7133
    Epoch 14/20
    50000/50000 [==============================] - 115s 2ms/step - loss: 0.8319 - acc: 0.7119 - val_loss: 0.8137 - val_acc: 0.7161
    Epoch 15/20
    50000/50000 [==============================] - 106s 2ms/step - loss: 0.8099 - acc: 0.7187 - val_loss: 0.7881 - val_acc: 0.7241
    Epoch 16/20
    50000/50000 [==============================] - 86s 2ms/step - loss: 0.7941 - acc: 0.7254 - val_loss: 0.8105 - val_acc: 0.7192
    Epoch 17/20
    50000/50000 [==============================] - 76s 2ms/step - loss: 0.7766 - acc: 0.7324 - val_loss: 0.7911 - val_acc: 0.7241
    Epoch 18/20
    50000/50000 [==============================] - 76s 2ms/step - loss: 0.7653 - acc: 0.7361 - val_loss: 0.7359 - val_acc: 0.7421
    Epoch 19/20
    50000/50000 [==============================] - 76s 2ms/step - loss: 0.7556 - acc: 0.7377 - val_loss: 0.7487 - val_acc: 0.7437
    Epoch 20/20
    50000/50000 [==============================] - 75s 2ms/step - loss: 0.7440 - acc: 0.7440 - val_loss: 0.7302 - val_acc: 0.7474





    <keras.callbacks.History at 0x7f8cd7b1b438>




```python
print('Using real-time data augmentation.')
# 进行数据预处理和实时的数据增强:
datagen = ImageDataGenerator(
    featurewise_center=False,  # 是否控制输入数据集的均值为0
    samplewise_center=False,  # 是否控制样本均值为0
    featurewise_std_normalization=False,  # 全部输入是否除以数据集的标准偏差(std)
    samplewise_std_normalization=False,  # 每个输入是否除以数据集的标准偏差
    zca_whitening=False,  # 是否应用ZCA白化
    rotation_range=0,  # 随机旋转(度数,0-180°)
    width_shift_range=0.1,  # 随机水平平移(整个宽度比例)
    height_shift_range=0.1,  # 随机竖直平移(整个高度比例)
    horizontal_flip=True,  # 随机水平翻转
    vertical_flip=False)  # 随机竖直翻转

# 生成训练增强数据
datagen.fit(x_train)

# fit训练
# Fit the model on the batches generated by datagen.flow().
model.fit_generator(datagen.flow(x_train, y_train,
                                 batch_size=batch_size),
                    steps_per_epoch=x_train.shape[0] // batch_size,
                    epochs=epochs,
                    validation_data=(x_test, y_test))
```

    Using real-time data augmentation.
    Epoch 1/20
    1562/1562 [==============================] - 68s 44ms/step - loss: 1.8172 - acc: 0.3348 - val_loss: 1.5825 - val_acc: 0.4202
    Epoch 2/20
    1562/1562 [==============================] - 68s 43ms/step - loss: 1.5852 - acc: 0.4221 - val_loss: 1.4322 - val_acc: 0.4794
    Epoch 3/20
    1562/1562 [==============================] - 72s 46ms/step - loss: 1.4609 - acc: 0.4720 - val_loss: 1.3075 - val_acc: 0.5254
    Epoch 4/20
    1562/1562 [==============================] - 73s 47ms/step - loss: 1.3757 - acc: 0.5065 - val_loss: 1.1862 - val_acc: 0.5771
    Epoch 5/20
    1562/1562 [==============================] - 74s 47ms/step - loss: 1.3029 - acc: 0.5371 - val_loss: 1.1373 - val_acc: 0.5927
    Epoch 6/20
    1562/1562 [==============================] - 78s 50ms/step - loss: 1.2501 - acc: 0.5535 - val_loss: 1.1786 - val_acc: 0.5838
    Epoch 7/20
    1562/1562 [==============================] - 78s 50ms/step - loss: 1.2071 - acc: 0.5704 - val_loss: 1.0379 - val_acc: 0.6281
    Epoch 8/20
    1562/1562 [==============================] - 78s 50ms/step - loss: 1.1705 - acc: 0.5858 - val_loss: 1.0924 - val_acc: 0.6180
    Epoch 9/20
    1562/1562 [==============================] - 78s 50ms/step - loss: 1.1352 - acc: 0.6012 - val_loss: 1.0783 - val_acc: 0.6285
    Epoch 10/20
    1562/1562 [==============================] - 78s 50ms/step - loss: 1.1033 - acc: 0.6117 - val_loss: 0.9947 - val_acc: 0.6515
    Epoch 11/20
    1562/1562 [==============================] - 78s 50ms/step - loss: 1.0768 - acc: 0.6206 - val_loss: 1.0336 - val_acc: 0.6323
    Epoch 12/20
    1562/1562 [==============================] - 77s 49ms/step - loss: 1.0511 - acc: 0.6332 - val_loss: 0.9094 - val_acc: 0.6791
    Epoch 13/20
    1562/1562 [==============================] - 78s 50ms/step - loss: 1.0251 - acc: 0.6381 - val_loss: 0.9096 - val_acc: 0.6755
    Epoch 14/20
    1562/1562 [==============================] - 78s 50ms/step - loss: 1.0056 - acc: 0.6471 - val_loss: 0.8570 - val_acc: 0.6995
    Epoch 15/20
    1562/1562 [==============================] - 77s 49ms/step - loss: 0.9874 - acc: 0.6542 - val_loss: 0.9028 - val_acc: 0.6851
    Epoch 16/20
    1562/1562 [==============================] - 77s 49ms/step - loss: 0.9740 - acc: 0.6592 - val_loss: 0.8249 - val_acc: 0.7121
    Epoch 17/20
    1562/1562 [==============================] - 77s 49ms/step - loss: 0.9581 - acc: 0.6642 - val_loss: 0.8329 - val_acc: 0.7088
    Epoch 18/20
    1562/1562 [==============================] - 76s 49ms/step - loss: 0.9416 - acc: 0.6722 - val_loss: 0.8716 - val_acc: 0.6998
    Epoch 19/20
    1562/1562 [==============================] - 77s 49ms/step - loss: 0.9323 - acc: 0.6758 - val_loss: 0.8601 - val_acc: 0.7030
    Epoch 20/20
    1562/1562 [==============================] - 77s 49ms/step - loss: 0.9186 - acc: 0.6818 - val_loss: 0.8004 - val_acc: 0.7230





    <keras.callbacks.History at 0x7fbf80eefc88>




```python
import os
# save_dir = os.path.join(os.getcwd(), 'saved_models')
save_dir = 'models/'
model_name = 'keras_cifar10_trained_model.h5'

# 保存模型和权重
model_path = os.path.join(save_dir, model_name)
model.save(model_path)
print('Saved trained model at %s ' % model_path)

# 测试训练模型
scores = model.evaluate(x_test, y_test, verbose=1)
print('Test loss:', scores[0])
print('Test accuracy:', scores[1])
```

    Saved trained model at models/keras_cifar10_trained_model.h5
    10000/10000 [==============================] - 4s 378us/step
    Test loss: 0.8004208864212036
    Test accuracy: 0.723


## ResNet训练CIFAR10 小图片分类

| Model         | n   | 200-epoch accuracy | Original paper accuracy | sec/epoch GTX1080Ti |
|---------------|-----|--------------------|-------------------------|---------------------|
| ResNet20 v1   | 3   | 92.16%             | 91.25%                  | 35                  |
| Resnet32 v1   | 5   | 92.46%             | 92.49%                  | 50                  |
| Resnet44 v1   | 7   | 92.50%             | 92.83%                  | 70                  |
| Resnet56 v1   | 9   | 92.71%             | 93.03%                  | 90                  |
| Resnet110 v1  | 18  | 92.65%             | 93.39+-.16%             | 165                 |
| Resnet164 v1  | 27  | -                  | 94.07%                  | -                   |
| Resnet1001 v1 | N/A | -                  | 92.39%                  | -                   |


| Model         | n   | 200-epoch accuracy | Original paper accuracy | sec/epoch GTX1080Ti |
|---------------|-----|--------------------|-------------------------|---------------------|
| ResNet20 v2   | 2   | -%                 | -%                      | --                  |
| Resnet32 v2   | N/A | NA%                | NA%                     | NA                  |
| Resnet44 v2   | N/A | NA%                | NA%                     | NA                  |
| Resnet56 v2   | 6   | 93.01%             | NA%                     | 100                 |
| Resnet110 v2  | 12  | 93.15%             | 93.63%                  | 180                 |
| Resnet164 v2  | 18  | -                  | 94.54%                  | -                   |
| Resnet1001 v2 | 111 | -                  | 95.08+-.14%             | -                   |


```python
from __future__ import print_function
import keras
from keras.layers import Dense, Conv2D, BatchNormalization, Activation
from keras.layers import AveragePooling2D, Input, Flatten
from keras.optimizers import Adam
from keras.callbacks import ModelCheckpoint, LearningRateScheduler
from keras.callbacks import ReduceLROnPlateau
from keras.preprocessing.image import ImageDataGenerator
from keras.regularizers import l2
from keras import backend as K
from keras.models import Model
from keras.datasets import cifar10
import numpy as np
import os
```

    Using TensorFlow backend.



```python
# 训练参数
batch_size = 16  # 原文中训练网络的batch_size为128, 官网为32
epochs = 20
data_augmentation = True
num_classes = 10

# 提取像素点均值以提高精度
subtract_pixel_mean = True
n = 3

# Model version
# Orig paper: version = 1 (ResNet v1), Improved ResNet: version = 2 (ResNet v2)
# ResNet模型的版本
# 原始论文版本：version = 1 (ResNet v1), 改进的ResNet: version = 2 (ResNet v2)
version = 1

# 不同的版本网络深度不一样，与模型参数n有关
if version == 1:
    depth = n * 6 + 2
elif version == 2:
    depth = n * 9 + 2

# 模型命名，深度，版本
model_type = 'ResNet%dv%d' % (depth, version)

# 加载CIFAR10数据
(x_train, y_train), (x_test, y_test) = cifar10.load_data()

# 输入图片的维度
input_shape = x_train.shape[1:]

# 标准化数据
x_train = x_train.astype('float32') / 255
x_test = x_test.astype('float32') / 255

# 进行数据的均值操作(mean)
if subtract_pixel_mean:
    x_train_mean = np.mean(x_train, axis=0)
    x_train -= x_train_mean
    x_test -= x_train_mean

print('x_train shape:', x_train.shape)
print(x_train.shape[0], 'train samples')
print(x_test.shape[0], 'test samples')
print('y_train shape:', y_train.shape)

# 将类型向量转化为二值类型矩阵（keras支持的格式）
y_train = keras.utils.to_categorical(y_train, num_classes)
y_test = keras.utils.to_categorical(y_test, num_classes)
```

    x_train shape: (50000, 32, 32, 3)
    50000 train samples
    10000 test samples
    y_train shape: (50000, 1)



```python
def lr_schedule(epoch):
    """
    学习率规划:
    学习率分别在80,120,160,180 epochs进行下降
    在训练每个epoch后通过调用callbacks进行学习率的调整

    #参数
        epoch(int):epochs数目
    #返回值
        lr(float):学习率
    """
    lr = 1e-3
    if epoch > 180:
        lr *= 0.5e-3
    elif epoch > 160:
        lr *= 1e-3
    elif epoch > 120:
        lr *= 1e-2
    elif epoch > 80:
        lr *= 1e-1
    print('Learning rate: ', lr)
    return lr


def resnet_layer(inputs,
                 num_filters=16,
                 kernel_size=3,
                 strides=1,
                 activation='relu',
                 batch_normalization=True,
                 conv_first=True):
    """
    定义基本的2D 卷积-BN-激活堆栈生成器(stack builder)

    #参数：
        inputsr):从输入图片或者之前层中输入的张量(tensor)
        num_filters(int):2维卷积，滤波器数目
        kernel_size(int):2维卷积卷积核二维尺寸
        activation(string):激活类型名称
        batch_notmalization(bool):是否包含BN层
        conv_first(bool):是否卷积层先，conv-bn-activation(True)或者bn-activation-conv(False)

    #返回值:
        x(tensor):作为下一层的输入张量(tensor)
    """
    conv = Conv2D(num_filters,
                  kernel_size=kernel_size,
                  strides=strides,
                  padding='same',
                  kernel_initializer='he_normal',
                  kernel_regularizer=l2(1e-4))

    x = inputs
    if conv_first:
        x = conv(x)
        if batch_normalization:
            x = BatchNormalization()(x)
        if activation is not None:
            x = Activation(activation)(x)
    else:
        if batch_normalization:
            x = BatchNormalization()(x)
        if activation is not None:
            x = Activation(activation)(x)
        x = conv(x)
    return x


def resnet_v1(input_shape, depth, num_classes=10):
    """
    ResNet V1 模型构建

    网络为最基本结构的堆栈组合(stacks):2x(3x3) Conv2D-BN-ReLu结构，3x3为卷积核
    该结构中最后的relu层在short-cut连接之后.
    整个网络分为三个stages，每个stage前面的特征图(feature map)需要降采样(downsampled),
    通过一个步长(strides)为2的卷积层实现。
    每个阶段(stage)的卷积核(filter)数目都会加倍。
    相同阶段内保持相同的卷积核数目和卷积特征图大小。
    各个阶段的特征图大小为:
    stage 0:32x32, 16
    stage 1:16x16, 32
    stage 2:8x8,   64
    模型大小如下：
    ResNet20 0.27M
    ResNet32 0.46M
    ResNet44 0.66M
    ResNet56 0.85M
    ResNet110 1.7M

    # 输入参数
        input_shape (tensor):输入图片tensor的尺寸(shape)
        depth(int):核心卷积层数目
        num_classed(int):图像分类类别(CIFAR10 有10类)

    # 返回值
        model (Model):keras的模型实例
    """
    if (depth - 2) % 6 != 0:
        raise ValueError('depth should be 6n+2 (eg 20, 32, 44 in [a])')
    # 开始实现模型的定义
    num_filters = 16
    num_res_blocks = int((depth - 2) / 6)

    inputs = Input(shape=input_shape)
    x = resnet_layer(inputs=inputs)
    # 残差单元(residual units)堆栈(stack)的实例实现
    for stack in range(3):
        for res_block in range(num_res_blocks):
            strides = 1
            if stack > 0 and res_block == 0:  # 每个stack的首层但是不是第一stack
                strides = 2  # downsample
            y = resnet_layer(inputs=x,
                             num_filters=num_filters,
                             strides=strides)
            y = resnet_layer(inputs=y,
                             num_filters=num_filters,
                             activation=None)
            if stack > 0 and res_block == 0:  # 每个stack的首层但是不是第一stack
                # 因为进行了特征图的降采样，所以需要在shortcut连接(shortcut connection)过程中,'
                # 进行线性投影(linear projection)以匹配降采样后的维度
                # 通过strides变换的卷积网络实现
                x = resnet_layer(inputs=x,
                                 num_filters=num_filters,
                                 kernel_size=1,
                                 strides=strides,
                                 activation=None,
                                 batch_normalization=False)
            x = keras.layers.add([x, y])
            x = Activation('relu')(x)
        num_filters *= 2

    # 在上层添加分类器
    # v1版本没有在最后的shortcut connection-Relu后添加BN层
    x = AveragePooling2D(pool_size=8)(x)
    y = Flatten()(x) # Flatten层用来将输入压平，常用于从卷积层到全连接层的过渡
    outputs = Dense(num_classes,
                    activation='softmax',
                    kernel_initializer='he_normal')(y) #he正态分布初始化

    # 实例化模型
    model = Model(inputs=inputs, outputs=outputs)
    return model


def resnet_v2(input_shape, depth, num_classes=10):
    """
    ResNet V2 模型构建
    网络最基本的堆栈组合为:(1X1)-(3x3)-(1x1)BN-RELU-Conv2D,称之为bottleneck层结构
    每个stage(stack)第一层shortcut connection层需要接1x1 Conv2D卷积层，进行尺寸转换
    接下来的第二层以及之后层则直连完成shortcut connection
    每个stage的开始阶段，特征图都需要先进行降采样(downsampled),
    通过strides=2的卷积层实现，filters数目需要翻倍。
    每个stage内，每层都拥有相同数目的滤波器数目和特征图大小。
    特征图大小如下：
    conv1 : 32x32, 16
    stage 0:32x32, 64
    stage 1:16x16, 128
    stage 2:8x8,   256

    # 输入参数
        input_shape(tensor):输入图片tensor的尺寸(shape)
        depth(int):核心卷积层的数目
        num_class(int):类别数目(CIFAR10类别为10)

    # 返回值
        model (Model):Keras模型实例
    """
    if (depth - 2) % 9 != 0:
        raise ValueError('depth should be 9n+2 (eg 56 or 110 in [b])')
    # 开始模型定义
    num_filters_in = 16
    num_res_blocks = int((depth - 2) / 9)

    inputs = Input(shape=input_shape)
    # v2版本在分离输入tensor为两个路径(paths)之前需要先进行卷积(Conv2D with BN-ReLU)
    x = resnet_layer(inputs=inputs,
                     num_filters=num_filters_in,
                     conv_first=True)

    # 残差单元堆栈实例化
    for stage in range(3):
        for res_block in range(num_res_blocks):
            activation = 'relu'
            batch_normalization = True
            strides = 1
            if stage == 0:
                num_filters_out = num_filters_in * 4
                if res_block == 0:  # 第一个stage的第一层
                    activation = None
                    batch_normalization = False
            else:
                num_filters_out = num_filters_in * 2
                if res_block == 0:  # 第一层，但非第一 stage
                    strides = 2    # 需要降采样

            # bottleneck残差单元
            y = resnet_layer(inputs=x,
                             num_filters=num_filters_in,
                             kernel_size=1,
                             strides=strides,
                             activation=activation,
                             batch_normalization=batch_normalization,
                             conv_first=False)
            y = resnet_layer(inputs=y,
                             num_filters=num_filters_in,
                             conv_first=False)
            y = resnet_layer(inputs=y,
                             num_filters=num_filters_out,
                             kernel_size=1,
                             conv_first=False)
            if res_block == 0:
                # 卷积操作进行shortcut connection的线性映射以匹配变化了的维度
                x = resnet_layer(inputs=x,
                                 num_filters=num_filters_out,
                                 kernel_size=1,
                                 strides=strides,
                                 activation=None,
                                 batch_normalization=False)
            x = keras.layers.add([x, y])

        num_filters_in = num_filters_out

    # 在上层添加分类器网络
    # v2版本在池化(Pooling)前需要添加BN-ReLU层
    x = BatchNormalization()(x)
    x = Activation('relu')(x)
    x = AveragePooling2D(pool_size=8)(x)
    y = Flatten()(x)
    outputs = Dense(num_classes,
                    activation='softmax',
                    kernel_initializer='he_normal')(y)

    # 实例化模型
    model = Model(inputs=inputs, outputs=outputs)
    return model
```


```python
if version == 2:
    model = resnet_v2(input_shape=input_shape, depth=depth)
else:
    model = resnet_v1(input_shape=input_shape, depth=depth)

model.compile(loss='categorical_crossentropy',
              optimizer=Adam(lr=lr_schedule(0)),
              metrics=['accuracy'])
model.summary()
print(model_type)

# 设置模型存储路径
# save_dir = os.path.join(os.getcwd(), 'saved_models')
save_dir = 'models/'
model_name = 'cifar10_%s_model.{epoch:03d}.h5' % model_type
if not os.path.isdir(save_dir):
    os.makedirs(save_dir)
filepath = os.path.join(save_dir, model_name)

# 设置callbacks函数进行回调保存模型和调整学习率
checkpoint = ModelCheckpoint(filepath=filepath,
                             monitor='val_acc',
                             verbose=1,
                             save_best_only=True)

lr_scheduler = LearningRateScheduler(lr_schedule)

lr_reducer = ReduceLROnPlateau(factor=np.sqrt(0.1),
                               cooldown=0,
                               patience=5,
                               min_lr=0.5e-6)

callbacks = [checkpoint, lr_reducer, lr_scheduler]

# 模型训练,有(无)数据增强
if not data_augmentation:
    print('Not using data augmentation.')
    model.fit(x_train, y_train,
              batch_size=batch_size,
              epochs=epochs,
              validation_data=(x_test, y_test),
              shuffle=True,
              callbacks=callbacks)
else:
    print('Using real-time data augmentation.')
    # 进行图片预处理与实时的数据增强：
    datagen = ImageDataGenerator(
        # 控制输入数据集的均值为0
        featurewise_center=False,
        # 控制单个样本均值为0
        samplewise_center=False,
        # 全部输入是否除以数据集的标准偏差(std)
        featurewise_std_normalization=False,
        # 每个输入是否除以数据集的标准偏差
        samplewise_std_normalization=False,
        # 是否应用ZCA白化
        zca_whitening=False,
        # ZCA白化的最小表示值(epsilon)
        zca_epsilon=1e-06,
        # 随机旋转(度数,0-180°)
        rotation_range=0,
        # 随机水平平移(整个宽度比例)
        width_shift_range=0.1,
        # 随机竖直平移(整个高度比例)
        height_shift_range=0.1,
        # 设置随机仿射(shear)变换范围
        shear_range=0.,
        # 设置随机放大缩小范围(zoom)
        zoom_range=0.,
        # 设置随机通道偏移(channel shift)范围
        channel_shift_range=0.,
        # 输入边界外部填充点模式设置
        fill_mode='nearest',
        # 对于fill_mode="constant"的value参数设置
        cval=0.,
        # 是否随机翻转(水平)
        horizontal_flip=True,
        # 是否随机翻转(竖直)
        vertical_flip=False,
        # 设置缩放因子(在应用其他所有变换之前都要设置)
        rescale=None,
        # 设置对每个输入应用的预处理函数
        preprocessing_function=None,
        # 图片数据格式，"channels_first"或者"channels_last"
        data_format=None,
        # 用于验证的图片数目组成分数(0-1之间)
        validation_split=0.0)

    # 生成训练增强数据
    datagen.fit(x_train)

    # fit训练
    # Fit the model on the batches generated by datagen.flow().
    model.fit_generator(datagen.flow(x_train, y_train, batch_size=batch_size),
                        validation_data=(x_test, y_test),
                        steps_per_epoch=x_train.shape[0] // batch_size, # 可能是版本的问题，需要提供该参数，数据集轮数
                        epochs=epochs, verbose=1, workers=4,
                        callbacks=callbacks)

# 评价训练得到的模型
scores = model.evaluate(x_test, y_test, verbose=1)
print('Test loss:', scores[0])
print('Test accuracy:', scores[1])
```

    Learning rate:  0.001
    __________________________________________________________________________________________________
    Layer (type)                    Output Shape         Param #     Connected to
    ==================================================================================================
    input_5 (InputLayer)            (None, 32, 32, 3)    0
    __________________________________________________________________________________________________
    conv2d_85 (Conv2D)              (None, 32, 32, 16)   448         input_5[0][0]
    __________________________________________________________________________________________________
    batch_normalization_77 (BatchNo (None, 32, 32, 16)   64          conv2d_85[0][0]
    __________________________________________________________________________________________________
    activation_77 (Activation)      (None, 32, 32, 16)   0           batch_normalization_77[0][0]
    __________________________________________________________________________________________________
    conv2d_86 (Conv2D)              (None, 32, 32, 16)   2320        activation_77[0][0]
    __________________________________________________________________________________________________
    batch_normalization_78 (BatchNo (None, 32, 32, 16)   64          conv2d_86[0][0]
    __________________________________________________________________________________________________
    activation_78 (Activation)      (None, 32, 32, 16)   0           batch_normalization_78[0][0]
    __________________________________________________________________________________________________
    conv2d_87 (Conv2D)              (None, 32, 32, 16)   2320        activation_78[0][0]
    __________________________________________________________________________________________________
    batch_normalization_79 (BatchNo (None, 32, 32, 16)   64          conv2d_87[0][0]
    __________________________________________________________________________________________________
    add_37 (Add)                    (None, 32, 32, 16)   0           activation_77[0][0]
                                                                     batch_normalization_79[0][0]
    __________________________________________________________________________________________________
    activation_79 (Activation)      (None, 32, 32, 16)   0           add_37[0][0]
    __________________________________________________________________________________________________
    conv2d_88 (Conv2D)              (None, 32, 32, 16)   2320        activation_79[0][0]
    __________________________________________________________________________________________________
    batch_normalization_80 (BatchNo (None, 32, 32, 16)   64          conv2d_88[0][0]
    __________________________________________________________________________________________________
    activation_80 (Activation)      (None, 32, 32, 16)   0           batch_normalization_80[0][0]
    __________________________________________________________________________________________________
    conv2d_89 (Conv2D)              (None, 32, 32, 16)   2320        activation_80[0][0]
    __________________________________________________________________________________________________
    batch_normalization_81 (BatchNo (None, 32, 32, 16)   64          conv2d_89[0][0]
    __________________________________________________________________________________________________
    add_38 (Add)                    (None, 32, 32, 16)   0           activation_79[0][0]
                                                                     batch_normalization_81[0][0]
    __________________________________________________________________________________________________
    activation_81 (Activation)      (None, 32, 32, 16)   0           add_38[0][0]
    __________________________________________________________________________________________________
    conv2d_90 (Conv2D)              (None, 32, 32, 16)   2320        activation_81[0][0]
    __________________________________________________________________________________________________
    batch_normalization_82 (BatchNo (None, 32, 32, 16)   64          conv2d_90[0][0]
    __________________________________________________________________________________________________
    activation_82 (Activation)      (None, 32, 32, 16)   0           batch_normalization_82[0][0]
    __________________________________________________________________________________________________
    conv2d_91 (Conv2D)              (None, 32, 32, 16)   2320        activation_82[0][0]
    __________________________________________________________________________________________________
    batch_normalization_83 (BatchNo (None, 32, 32, 16)   64          conv2d_91[0][0]
    __________________________________________________________________________________________________
    add_39 (Add)                    (None, 32, 32, 16)   0           activation_81[0][0]
                                                                     batch_normalization_83[0][0]
    __________________________________________________________________________________________________
    activation_83 (Activation)      (None, 32, 32, 16)   0           add_39[0][0]
    __________________________________________________________________________________________________
    conv2d_92 (Conv2D)              (None, 16, 16, 32)   4640        activation_83[0][0]
    __________________________________________________________________________________________________
    batch_normalization_84 (BatchNo (None, 16, 16, 32)   128         conv2d_92[0][0]
    __________________________________________________________________________________________________
    activation_84 (Activation)      (None, 16, 16, 32)   0           batch_normalization_84[0][0]
    __________________________________________________________________________________________________
    conv2d_93 (Conv2D)              (None, 16, 16, 32)   9248        activation_84[0][0]
    __________________________________________________________________________________________________
    conv2d_94 (Conv2D)              (None, 16, 16, 32)   544         activation_83[0][0]
    __________________________________________________________________________________________________
    batch_normalization_85 (BatchNo (None, 16, 16, 32)   128         conv2d_93[0][0]
    __________________________________________________________________________________________________
    add_40 (Add)                    (None, 16, 16, 32)   0           conv2d_94[0][0]
                                                                     batch_normalization_85[0][0]
    __________________________________________________________________________________________________
    activation_85 (Activation)      (None, 16, 16, 32)   0           add_40[0][0]
    __________________________________________________________________________________________________
    conv2d_95 (Conv2D)              (None, 16, 16, 32)   9248        activation_85[0][0]
    __________________________________________________________________________________________________
    batch_normalization_86 (BatchNo (None, 16, 16, 32)   128         conv2d_95[0][0]
    __________________________________________________________________________________________________
    activation_86 (Activation)      (None, 16, 16, 32)   0           batch_normalization_86[0][0]
    __________________________________________________________________________________________________
    conv2d_96 (Conv2D)              (None, 16, 16, 32)   9248        activation_86[0][0]
    __________________________________________________________________________________________________
    batch_normalization_87 (BatchNo (None, 16, 16, 32)   128         conv2d_96[0][0]
    __________________________________________________________________________________________________
    add_41 (Add)                    (None, 16, 16, 32)   0           activation_85[0][0]
                                                                     batch_normalization_87[0][0]
    __________________________________________________________________________________________________
    activation_87 (Activation)      (None, 16, 16, 32)   0           add_41[0][0]
    __________________________________________________________________________________________________
    conv2d_97 (Conv2D)              (None, 16, 16, 32)   9248        activation_87[0][0]
    __________________________________________________________________________________________________
    batch_normalization_88 (BatchNo (None, 16, 16, 32)   128         conv2d_97[0][0]
    __________________________________________________________________________________________________
    activation_88 (Activation)      (None, 16, 16, 32)   0           batch_normalization_88[0][0]
    __________________________________________________________________________________________________
    conv2d_98 (Conv2D)              (None, 16, 16, 32)   9248        activation_88[0][0]
    __________________________________________________________________________________________________
    batch_normalization_89 (BatchNo (None, 16, 16, 32)   128         conv2d_98[0][0]
    __________________________________________________________________________________________________
    add_42 (Add)                    (None, 16, 16, 32)   0           activation_87[0][0]
                                                                     batch_normalization_89[0][0]
    __________________________________________________________________________________________________
    activation_89 (Activation)      (None, 16, 16, 32)   0           add_42[0][0]
    __________________________________________________________________________________________________
    conv2d_99 (Conv2D)              (None, 8, 8, 64)     18496       activation_89[0][0]
    __________________________________________________________________________________________________
    batch_normalization_90 (BatchNo (None, 8, 8, 64)     256         conv2d_99[0][0]
    __________________________________________________________________________________________________
    activation_90 (Activation)      (None, 8, 8, 64)     0           batch_normalization_90[0][0]
    __________________________________________________________________________________________________
    conv2d_100 (Conv2D)             (None, 8, 8, 64)     36928       activation_90[0][0]
    __________________________________________________________________________________________________
    conv2d_101 (Conv2D)             (None, 8, 8, 64)     2112        activation_89[0][0]
    __________________________________________________________________________________________________
    batch_normalization_91 (BatchNo (None, 8, 8, 64)     256         conv2d_100[0][0]
    __________________________________________________________________________________________________
    add_43 (Add)                    (None, 8, 8, 64)     0           conv2d_101[0][0]
                                                                     batch_normalization_91[0][0]
    __________________________________________________________________________________________________
    activation_91 (Activation)      (None, 8, 8, 64)     0           add_43[0][0]
    __________________________________________________________________________________________________
    conv2d_102 (Conv2D)             (None, 8, 8, 64)     36928       activation_91[0][0]
    __________________________________________________________________________________________________
    batch_normalization_92 (BatchNo (None, 8, 8, 64)     256         conv2d_102[0][0]
    __________________________________________________________________________________________________
    activation_92 (Activation)      (None, 8, 8, 64)     0           batch_normalization_92[0][0]
    __________________________________________________________________________________________________
    conv2d_103 (Conv2D)             (None, 8, 8, 64)     36928       activation_92[0][0]
    __________________________________________________________________________________________________
    batch_normalization_93 (BatchNo (None, 8, 8, 64)     256         conv2d_103[0][0]
    __________________________________________________________________________________________________
    add_44 (Add)                    (None, 8, 8, 64)     0           activation_91[0][0]
                                                                     batch_normalization_93[0][0]
    __________________________________________________________________________________________________
    activation_93 (Activation)      (None, 8, 8, 64)     0           add_44[0][0]
    __________________________________________________________________________________________________
    conv2d_104 (Conv2D)             (None, 8, 8, 64)     36928       activation_93[0][0]
    __________________________________________________________________________________________________
    batch_normalization_94 (BatchNo (None, 8, 8, 64)     256         conv2d_104[0][0]
    __________________________________________________________________________________________________
    activation_94 (Activation)      (None, 8, 8, 64)     0           batch_normalization_94[0][0]
    __________________________________________________________________________________________________
    conv2d_105 (Conv2D)             (None, 8, 8, 64)     36928       activation_94[0][0]
    __________________________________________________________________________________________________
    batch_normalization_95 (BatchNo (None, 8, 8, 64)     256         conv2d_105[0][0]
    __________________________________________________________________________________________________
    add_45 (Add)                    (None, 8, 8, 64)     0           activation_93[0][0]
                                                                     batch_normalization_95[0][0]
    __________________________________________________________________________________________________
    activation_95 (Activation)      (None, 8, 8, 64)     0           add_45[0][0]
    __________________________________________________________________________________________________
    average_pooling2d_5 (AveragePoo (None, 1, 1, 64)     0           activation_95[0][0]
    __________________________________________________________________________________________________
    flatten_5 (Flatten)             (None, 64)           0           average_pooling2d_5[0][0]
    __________________________________________________________________________________________________
    dense_5 (Dense)                 (None, 10)           650         flatten_5[0][0]
    ==================================================================================================
    Total params: 274,442
    Trainable params: 273,066
    Non-trainable params: 1,376
    __________________________________________________________________________________________________
    ResNet20v1
    Using real-time data augmentation.
    Epoch 1/20
    Learning rate:  0.001
    3125/3125 [==============================] - 312s 100ms/step - loss: 1.5947 - acc: 0.4818 - val_loss: 1.5713 - val_acc: 0.5164

    Epoch 00001: val_acc improved from -inf to 0.51640, saving model to models/cifar10_ResNet20v1_model.001.h5
    Epoch 2/20
    Learning rate:  0.001
    3125/3125 [==============================] - 265s 85ms/step - loss: 1.2072 - acc: 0.6370 - val_loss: 1.3945 - val_acc: 0.6066

    Epoch 00002: val_acc improved from 0.51640 to 0.60660, saving model to models/cifar10_ResNet20v1_model.002.h5
    Epoch 3/20
    Learning rate:  0.001
    3125/3125 [==============================] - 276s 88ms/step - loss: 1.0676 - acc: 0.6917 - val_loss: 0.9612 - val_acc: 0.7268

    Epoch 00003: val_acc improved from 0.60660 to 0.72680, saving model to models/cifar10_ResNet20v1_model.003.h5
    Epoch 4/20
    Learning rate:  0.001
    3125/3125 [==============================] - 261s 84ms/step - loss: 0.9786 - acc: 0.7284 - val_loss: 1.1044 - val_acc: 0.6874

    Epoch 00004: val_acc did not improve from 0.72680
    Epoch 5/20
    Learning rate:  0.001
    3125/3125 [==============================] - 261s 84ms/step - loss: 0.9215 - acc: 0.7491 - val_loss: 0.9581 - val_acc: 0.7372

    Epoch 00005: val_acc improved from 0.72680 to 0.73720, saving model to models/cifar10_ResNet20v1_model.005.h5
    Epoch 6/20
    Learning rate:  0.001
    3125/3125 [==============================] - 261s 84ms/step - loss: 0.8801 - acc: 0.7683 - val_loss: 0.8495 - val_acc: 0.7835

    Epoch 00006: val_acc improved from 0.73720 to 0.78350, saving model to models/cifar10_ResNet20v1_model.006.h5
    Epoch 7/20
    Learning rate:  0.001
    3125/3125 [==============================] - 260s 83ms/step - loss: 0.8514 - acc: 0.7766 - val_loss: 1.1488 - val_acc: 0.6938

    Epoch 00007: val_acc did not improve from 0.78350
    Epoch 8/20
    Learning rate:  0.001
    3125/3125 [==============================] - 260s 83ms/step - loss: 0.8275 - acc: 0.7875 - val_loss: 0.8583 - val_acc: 0.7840

    Epoch 00008: val_acc improved from 0.78350 to 0.78400, saving model to models/cifar10_ResNet20v1_model.008.h5
    Epoch 9/20
    Learning rate:  0.001
    3125/3125 [==============================] - 260s 83ms/step - loss: 0.8053 - acc: 0.7958 - val_loss: 0.9273 - val_acc: 0.7574

    Epoch 00009: val_acc did not improve from 0.78400
    Epoch 10/20
    Learning rate:  0.001
    3125/3125 [==============================] - 260s 83ms/step - loss: 0.7858 - acc: 0.8045 - val_loss: 0.8533 - val_acc: 0.7881

    Epoch 00010: val_acc improved from 0.78400 to 0.78810, saving model to models/cifar10_ResNet20v1_model.010.h5
    Epoch 11/20
    Learning rate:  0.001
    3125/3125 [==============================] - 261s 83ms/step - loss: 0.7727 - acc: 0.8092 - val_loss: 1.0937 - val_acc: 0.7302

    Epoch 00011: val_acc did not improve from 0.78810
    Epoch 12/20
    Learning rate:  0.001
    3125/3125 [==============================] - 260s 83ms/step - loss: 0.7609 - acc: 0.8139 - val_loss: 0.7869 - val_acc: 0.8089

    Epoch 00012: val_acc improved from 0.78810 to 0.80890, saving model to models/cifar10_ResNet20v1_model.012.h5
    Epoch 13/20
    Learning rate:  0.001
    3125/3125 [==============================] - 259s 83ms/step - loss: 0.7482 - acc: 0.8195 - val_loss: 0.8320 - val_acc: 0.7997

    Epoch 00013: val_acc did not improve from 0.80890
    Epoch 14/20
    Learning rate:  0.001
    3125/3125 [==============================] - 260s 83ms/step - loss: 0.7348 - acc: 0.8249 - val_loss: 0.7548 - val_acc: 0.8166

    Epoch 00014: val_acc improved from 0.80890 to 0.81660, saving model to models/cifar10_ResNet20v1_model.014.h5
    Epoch 15/20
    Learning rate:  0.001
    3125/3125 [==============================] - 260s 83ms/step - loss: 0.7285 - acc: 0.8258 - val_loss: 1.0691 - val_acc: 0.7290

    Epoch 00015: val_acc did not improve from 0.81660
    Epoch 16/20
    Learning rate:  0.001
    3125/3125 [==============================] - 264s 84ms/step - loss: 0.7197 - acc: 0.8296 - val_loss: 0.8380 - val_acc: 0.7988

    Epoch 00016: val_acc did not improve from 0.81660
    Epoch 17/20
    Learning rate:  0.001
    3125/3125 [==============================] - 263s 84ms/step - loss: 0.7089 - acc: 0.8344 - val_loss: 0.8024 - val_acc: 0.8096

    Epoch 00017: val_acc did not improve from 0.81660
    Epoch 18/20
    Learning rate:  0.001
    3125/3125 [==============================] - 348s 111ms/step - loss: 0.7017 - acc: 0.8357 - val_loss: 0.7371 - val_acc: 0.8262

    Epoch 00018: val_acc improved from 0.81660 to 0.82620, saving model to models/cifar10_ResNet20v1_model.018.h5
    Epoch 19/20
    Learning rate:  0.001
    3125/3125 [==============================] - 300s 96ms/step - loss: 0.6954 - acc: 0.8394 - val_loss: 0.7666 - val_acc: 0.8267

    Epoch 00019: val_acc improved from 0.82620 to 0.82670, saving model to models/cifar10_ResNet20v1_model.019.h5
    Epoch 20/20
    Learning rate:  0.001
    3125/3125 [==============================] - 276s 88ms/step - loss: 0.6929 - acc: 0.8393 - val_loss: 0.8844 - val_acc: 0.7866

    Epoch 00020: val_acc did not improve from 0.82670
    10000/10000 [==============================] - 13s 1ms/step
    Test loss: 0.8843909492492675
    Test accuracy: 0.7866


## 卷积层可视化

以VGG16为例进行卷积层的可视化，详细实现原理可参考[机器之心-卷积特征可视化](https://www.jiqizhixin.com/articles/2019-01-31-13)

简而言之，卷积层可视化实际是对每层的卷积核的最大响应的图像进行生成。输入为随机噪声的灰度图，通过定义指定层的损失函数（将特征图激活后的均值作为损失函数），通过梯度上升的方式进行最大化激活值。最终反向生成能够得到相应卷积核最大激活输出的图像。


```python
from __future__ import print_function

import time
import numpy as np
from PIL import Image as pil_image
from keras.preprocessing.image import save_img
from keras import layers
from keras.applications import vgg16
from keras import backend as K

# GPU性能不够，禁用GPU，用CPU来跑
import os
os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
os.environ["CUDA_VISIBLE_DEVICES"] = ""

def normalize(x):
    """
    功能函数：标准化张量(tensor)

    # 输入参数
        x:输入张量
    # 输出
        输入张量的标准化输出
    """
    return x / (K.sqrt(K.mean(K.square(x))) + K.epsilon())


def deprocess_image(x):
    """
    功能函数:将浮点数数组转化为有效的uint8类型图片

    # 输入参数
        x:代表生成图片的Numpy向量数组
    # 输出
        处理过的numpy数组，能够通过imshow等方式显示的图片格式
    """
    # normalize tensor: center on 0., ensure std is 0.25
    # 标准化张量:数值中心保持为0，
    x -= x.mean()
    x /= (x.std() + K.epsilon())
    x *= 0.25

    # clip to [0, 1]
    x += 0.5
    x = np.clip(x, 0, 1)

    # convert to RGB array
    x *= 255
    if K.image_data_format() == 'channels_first':
        x = x.transpose((1, 2, 0))
    x = np.clip(x, 0, 255).astype('uint8')
    return x


def process_image(x, former):
    """
    功能函数:将有效的uint8类型图片格式转化为浮点数数组
    为'deprocess_image'的反向操作

    # 输入参数
        x:numpy数值，能够通过imshow等进行显示
        fromer: 之前的numpy-array数据.
                需要确定之前的均值(mean)和variance(方差).

    #返回值
        处理过的代表图片的numpy数组
    """
    if K.image_data_format() == 'channels_first':
        x = x.transpose((2, 0, 1))
    return (x / 255 - 0.5) * 4 * former.std() + former.mean()


# 默认size为412*412，太慢了，改成52*52
def visualize_layer(model,
                    layer_name,
                    step=1.,
                    epochs=15,
                    upscaling_steps=9,
                    upscaling_factor=1.2,
                    output_dim=(52,52),
                    filter_range=(0, None)):
    """
    可视化得到模型指定层最大相关的滤波器(通过激活层的均值大小判断)

    #输入参数
        model:包含层名称的模型
        layer_name:需要进行可视化的层名称，需要为模型的一部分
        step:梯度上升的步长大小(step size)
        epochs:梯度上升的迭代轮数
        upscaling_steps:upscaling的步长数目,upscaling用于生成图的扩大
                        初始图像大小为(80,80)，最终图像为(412,412)
        upscaling_factor:用于缓慢更新图像大小的参数(factor)，最终大小为输出大小
                        　如官方80->412为412=80*(1.2)**9
        output_dim:[img_width, img_height]输出图像尺寸
        filter_range:Tupel类型[lower,upper]
                     确定了需要计算的卷积核(滤波器)序号范围
                     如果upper参数为'None'，
                     则将最后一个卷积核序号作为上限
    """

    def _generate_filter_image(input_img,
                               layer_output,
                               filter_index):
        """
        生成指定卷积核的图像

        # 输入参数
            input_img:输入图像张量
            layer_output:输出图像张量
            filter_index:需要进行处理的滤波器序号
                        　需保证序号有效

        # 返回值
            返回None，如无图片
            如有图片，则返回tuple类型的图片数组(iamge array)以及最终的loss值
        """
        s_time = time.time()

        # 这里建立了一个损失函数来最大化对应层的nth卷积核的激活值
        if K.image_data_format() == 'channels_first':
            loss = K.mean(layer_output[:, filter_index, :, :])
        else:
            loss = K.mean(layer_output[:, :, :, filter_index])

        # 根据loss计算对输入图片的梯度值
        grads = K.gradients(loss, input_img)[0]

        # 正则化技巧(normalization trick):需要标准化梯度值
        grads = normalize(grads)

        # 该函数返回得到输入图片的损失值和梯度值
        iterate = K.function([input_img], [loss, grads])

        # 初始图片为随机噪声的灰度图
        intermediate_dim = tuple(
            int(x / (upscaling_factor ** upscaling_steps)) for x in output_dim)
        if K.image_data_format() == 'channels_first':
            input_img_data = np.random.random(
                (1, 3, intermediate_dim[0], intermediate_dim[1]))
        else:
            input_img_data = np.random.random(
                (1, intermediate_dim[0], intermediate_dim[1], 3))
        input_img_data = (input_img_data - 0.5) * 20 + 128

        # 这里需要逐步扩增到原先的大小(original size),
        # 主要是为了防止可视化结构(visualized structure)的主导高频(domminating highj-frequency)现象
        # 这种情况可能会在我们直接计算412维度图像的时候发生。
        # 从低维开始更容易在每个维度有一个更好的开始点(starting point),
        # 能有效防止局部最小值的出现(poor local minima)
        for up in reversed(range(upscaling_steps)):
            # 逐步进行梯度上升,如20 steps
            for _ in range(epochs):
                loss_value, grads_value = iterate([input_img_data])
                input_img_data += grads_value * step　#step默认为1

                # 一些卷积核可能输出为0，需要跳过
                if loss_value <= K.epsilon():
                    return None

            # 计算扩增的维度
            intermediate_dim = tuple(
                int(x / (upscaling_factor ** up)) for x in output_dim)
            # 得到扩增图像数据
            img = deprocess_image(input_img_data[0])
            img = np.array(pil_image.fromarray(img).resize(intermediate_dim,
                                                           pil_image.BICUBIC))
            input_img_data = [process_image(img, input_img_data[0])]

        # 解码得到输入激活图像
        img = deprocess_image(input_img_data[0])
        e_time = time.time()
        print('Costs of filter {:3}: {:5.0f} ( {:4.2f}s )'.format(filter_index,
                                                                  loss_value,
                                                                  e_time - s_time))
        return img, loss_value

    def _draw_filters(filters, n=None):
        """
        绘制得到最佳的卷积核输入图像(激活均值最大),nxn网格形式

        # 输入参数
            filters:一系列对应卷积核的生成图片以及损失值(loss)
            n:网格维度
              n为None的话，则使用最大的网格大小显示
        """
        if n is None:
            n = int(np.floor(np.sqrt(len(filters))))

        # 认为用于最大损失值的卷积核的激活图是可观的.
        # 这里只保留最大的n*n个卷积核
        filters.sort(key=lambda x: x[1], reverse=True)
        filters = filters[:n * n]

        # 先建立一张足够大的黑色背景图
        # 如8*8的卷积核数目,图像大小为412*412，间隔为5px
        MARGIN = 5
        width = n * output_dim[0] + (n - 1) * MARGIN
        height = n * output_dim[1] + (n - 1) * MARGIN
        stitched_filters = np.zeros((width, height, 3), dtype='uint8')

        # 在图像上进行已保存得到的卷积核图像的填充
        for i in range(n):
            for j in range(n):
                img, _ = filters[i * n + j]
                width_margin = (output_dim[0] + MARGIN) * i
                height_margin = (output_dim[1] + MARGIN) * j
                stitched_filters[
                    width_margin: width_margin + output_dim[0],
                    height_margin: height_margin + output_dim[1], :] = img

        # save the result to disk
        # 将得到的图像结果存盘
        save_img('out_pics/vgg_{0:}_{1:}x{1:}.png'.format(layer_name, n), stitched_filters)

    #　正式进行图片输出
    # 输入图片的占位符(placeholder)
    assert len(model.inputs) == 1
    input_img = model.inputs[0]

    # 得到每个主要层(key layer)的符号输出(每个层的唯一标识名称)
    layer_dict = dict([(layer.name, layer) for layer in model.layers[1:]])

    output_layer = layer_dict[layer_name]
    assert isinstance(output_layer, layers.Conv2D)

    # 得到需要处理的滤波器范围
    filter_lower = filter_range[0]
    filter_upper = (filter_range[1]
                    if filter_range[1] is not None
                    else len(output_layer.get_weights()[1]))
    assert(filter_lower >= 0
           and filter_upper <= len(output_layer.get_weights()[1])
           and filter_upper > filter_lower)
    print('Compute filters {:} to {:}'.format(filter_lower, filter_upper))

    # 迭代通过每个滤波器并得到对应的激活图
    processed_filters = []
    for f in range(filter_lower, filter_upper):
        img_loss = _generate_filter_image(input_img, output_layer.output, f)

        if img_loss is not None:
            processed_filters.append(img_loss)

    print('{} filter processed.'.format(len(processed_filters)))
    # 最终绘制并保存最佳的滤波器图像到硬盘
    _draw_filters(processed_filters)


if __name__ == '__main__':
    # the name of the layer we want to visualize
    # (see model definition at keras/applications/vgg16.py)
    # 需要定义我们需要可视化的层的名字
    # 模型定义可在　keras/applications/vgg16.py中得到
    # 也可以通过  "summary()"函数得到
    LAYER_NAME = 'block5_conv1'

    # 通过ImageNet权重进行VGG16网络的构建
    vgg = vgg16.VGG16(weights='imagenet', include_top=False)
    print('Model loaded.')
    vgg.summary()

    #　调用可视化函数
    visualize_layer(vgg, LAYER_NAME)
```

    Using TensorFlow backend.


    Model loaded.
    _________________________________________________________________
    Layer (type)                 Output Shape              Param #
    =================================================================
    input_1 (InputLayer)         (None, None, None, 3)     0
    _________________________________________________________________
    block1_conv1 (Conv2D)        (None, None, None, 64)    1792
    _________________________________________________________________
    block1_conv2 (Conv2D)        (None, None, None, 64)    36928
    _________________________________________________________________
    block1_pool (MaxPooling2D)   (None, None, None, 64)    0
    _________________________________________________________________
    block2_conv1 (Conv2D)        (None, None, None, 128)   73856
    _________________________________________________________________
    block2_conv2 (Conv2D)        (None, None, None, 128)   147584
    _________________________________________________________________
    block2_pool (MaxPooling2D)   (None, None, None, 128)   0
    _________________________________________________________________
    block3_conv1 (Conv2D)        (None, None, None, 256)   295168
    _________________________________________________________________
    block3_conv2 (Conv2D)        (None, None, None, 256)   590080
    _________________________________________________________________
    block3_conv3 (Conv2D)        (None, None, None, 256)   590080
    _________________________________________________________________
    block3_pool (MaxPooling2D)   (None, None, None, 256)   0
    _________________________________________________________________
    block4_conv1 (Conv2D)        (None, None, None, 512)   1180160
    _________________________________________________________________
    block4_conv2 (Conv2D)        (None, None, None, 512)   2359808
    _________________________________________________________________
    block4_conv3 (Conv2D)        (None, None, None, 512)   2359808
    _________________________________________________________________
    block4_pool (MaxPooling2D)   (None, None, None, 512)   0
    _________________________________________________________________
    block5_conv1 (Conv2D)        (None, None, None, 512)   2359808
    _________________________________________________________________
    block5_conv2 (Conv2D)        (None, None, None, 512)   2359808
    _________________________________________________________________
    block5_conv3 (Conv2D)        (None, None, None, 512)   2359808
    _________________________________________________________________
    block5_pool (MaxPooling2D)   (None, None, None, 512)   0
    =================================================================
    Total params: 14,714,688
    Trainable params: 14,714,688
    Non-trainable params: 0
    _________________________________________________________________
    Compute filters 0 to 512
    Costs of filter   0:   688 ( 4.87s )
    Costs of filter   1:  1440 ( 5.90s )
    Costs of filter   3:   761 ( 4.95s )
    Costs of filter   4:  1282 ( 5.58s )
    Costs of filter   5:   454 ( 5.47s )
    Costs of filter   7:  1144 ( 6.69s )
    Costs of filter   9:   506 ( 5.25s )
    Costs of filter  14:   738 ( 5.84s )
    Costs of filter  15:   703 ( 5.28s )
    Costs of filter  16:   729 ( 5.04s )
    Costs of filter  17:  1070 ( 4.97s )
    Costs of filter  20:   616 ( 5.01s )
    Costs of filter  21:   870 ( 5.09s )
    Costs of filter  22:   869 ( 5.03s )
    Costs of filter  24:   493 ( 5.04s )
    Costs of filter  25:   765 ( 5.02s )
    Costs of filter  27:  1162 ( 5.60s )
    Costs of filter  29:   349 ( 5.23s )
    Costs of filter  30:   742 ( 5.72s )
    Costs of filter  36:   622 ( 5.38s )
    Costs of filter  39:   910 ( 5.18s )
    Costs of filter  40:   572 ( 5.27s )
    Costs of filter  42:   587 ( 5.29s )
    Costs of filter  44:  1016 ( 5.32s )
    Costs of filter  46:   830 ( 5.80s )
    Costs of filter  49:   698 ( 6.77s )
    Costs of filter  52:  1301 ( 6.34s )
    Costs of filter  53:   800 ( 5.64s )
    Costs of filter  54:  1371 ( 5.88s )
    Costs of filter  58:   507 ( 5.65s )
    Costs of filter  61:   723 ( 6.62s )
    Costs of filter  64:   974 ( 8.11s )
    Costs of filter  65:   707 ( 6.10s )
    Costs of filter  66:   521 ( 5.80s )
    Costs of filter  68:   931 ( 5.46s )
    Costs of filter  70:   774 ( 5.43s )
    Costs of filter  72:   913 ( 5.42s )
    Costs of filter  74:  1274 ( 5.43s )
    Costs of filter  75:   535 ( 5.46s )
    Costs of filter  79:   547 ( 5.52s )
    Costs of filter  82:   514 ( 5.79s )
    Costs of filter  84:   463 ( 5.57s )
    Costs of filter  85:   720 ( 5.54s )
    Costs of filter  87:   738 ( 6.31s )
    Costs of filter  88:   627 ( 6.45s )
    Costs of filter  89:   840 ( 6.18s )
    Costs of filter  90:  1148 ( 5.63s )
    Costs of filter  91:  1227 ( 5.75s )
    Costs of filter  94:   816 ( 5.67s )
    Costs of filter 103:   673 ( 5.75s )
    Costs of filter 109:   955 ( 5.83s )
    Costs of filter 110:   523 ( 5.86s )
    Costs of filter 111:   784 ( 5.84s )
    Costs of filter 112:   598 ( 5.86s )
    Costs of filter 114:   954 ( 5.89s )
    Costs of filter 116:   552 ( 6.00s )
    Costs of filter 117:  1761 ( 5.89s )
    Costs of filter 122:   744 ( 5.98s )
    Costs of filter 126:   927 ( 6.01s )
    Costs of filter 127:   887 ( 6.04s )
    Costs of filter 128:   793 ( 6.50s )
    Costs of filter 131:   447 ( 6.98s )
    Costs of filter 133:   447 ( 7.13s )
    Costs of filter 134:   700 ( 6.83s )
    Costs of filter 136:   764 ( 6.80s )
    Costs of filter 139:   595 ( 6.19s )
    Costs of filter 140:   461 ( 6.22s )
    Costs of filter 143:   810 ( 6.25s )
    Costs of filter 145:   727 ( 6.24s )
    Costs of filter 146:   849 ( 6.26s )
    Costs of filter 147:   774 ( 6.29s )
    Costs of filter 149:   338 ( 6.39s )
    Costs of filter 156:   911 ( 6.38s )
    Costs of filter 157:   976 ( 6.36s )
    Costs of filter 158:   991 ( 6.37s )
    Costs of filter 162:   792 ( 6.39s )
    Costs of filter 165:   752 ( 6.42s )
    Costs of filter 166:   838 ( 6.50s )
    Costs of filter 168:   557 ( 6.49s )
    Costs of filter 170:  1001 ( 6.51s )
    Costs of filter 171:   653 ( 6.54s )
    Costs of filter 172:  1060 ( 6.54s )
    Costs of filter 174:   692 ( 6.56s )
    Costs of filter 176:  1488 ( 6.65s )
    Costs of filter 177:   473 ( 6.66s )
    Costs of filter 179:   834 ( 6.83s )
    Costs of filter 181:   946 ( 6.60s )
    Costs of filter 182:   982 ( 6.66s )
    Costs of filter 187:   947 ( 6.68s )
    Costs of filter 194:   734 ( 6.83s )
    Costs of filter 195:   612 ( 6.84s )
    Costs of filter 196:   766 ( 6.87s )
    Costs of filter 201:   426 ( 6.93s )
    Costs of filter 203:   640 ( 6.94s )
    Costs of filter 205:  1639 ( 6.97s )
    Costs of filter 206:   356 ( 7.01s )
    Costs of filter 208:  1142 ( 6.93s )
    Costs of filter 213:   721 ( 7.06s )
    Costs of filter 218:   647 ( 7.04s )
    Costs of filter 219:   660 ( 7.17s )
    Costs of filter 220:  1653 ( 7.15s )
    Costs of filter 223:   420 ( 7.14s )
    Costs of filter 228:   725 ( 7.29s )
    Costs of filter 236:   528 ( 7.38s )
    Costs of filter 240:   813 ( 7.34s )
    Costs of filter 242:   942 ( 7.94s )
    Costs of filter 243:   914 ( 8.18s )
    Costs of filter 245:   828 ( 7.40s )
    Costs of filter 246:   362 ( 7.54s )
    Costs of filter 247:  1444 ( 7.50s )
    Costs of filter 251:   973 ( 7.50s )
    Costs of filter 253:   927 ( 7.56s )
    Costs of filter 255:   809 ( 7.54s )
    Costs of filter 257:  1059 ( 7.64s )
    Costs of filter 258:   680 ( 7.68s )
    Costs of filter 259:   519 ( 7.59s )
    Costs of filter 260:   462 ( 7.61s )
    Costs of filter 266:  1327 ( 7.67s )
    Costs of filter 268:   603 ( 7.95s )
    Costs of filter 269:   588 ( 7.84s )
    Costs of filter 270:  1116 ( 7.84s )
    Costs of filter 271:   705 ( 7.77s )
    Costs of filter 272:   598 ( 7.80s )
    Costs of filter 281:   766 ( 7.90s )
    Costs of filter 283:   546 ( 7.92s )
    Costs of filter 285:   727 ( 7.96s )
    Costs of filter 287:   533 ( 8.12s )
    Costs of filter 288:  1529 ( 8.11s )
    Costs of filter 289:   910 ( 8.14s )
    Costs of filter 292:   461 ( 8.08s )
    Costs of filter 293:   720 ( 8.20s )
    Costs of filter 295:   375 ( 8.40s )
    Costs of filter 297:   717 ( 8.27s )
    Costs of filter 300:   862 ( 8.18s )
    Costs of filter 303:   517 ( 8.17s )
    Costs of filter 306:  1385 ( 8.40s )
    Costs of filter 308:  1145 ( 8.40s )
    Costs of filter 310:   670 ( 8.34s )
    Costs of filter 311:   634 ( 8.34s )
    Costs of filter 316:   534 ( 8.40s )
    Costs of filter 319:   916 ( 8.42s )
    Costs of filter 320:   920 ( 8.48s )
    Costs of filter 322:   521 ( 8.60s )
    Costs of filter 323:   553 ( 8.57s )
    Costs of filter 327:   558 ( 8.55s )
    Costs of filter 328:  1131 ( 8.70s )
    Costs of filter 329:   607 ( 8.70s )
    Costs of filter 331:   689 ( 8.73s )
    Costs of filter 334:  1178 ( 8.64s )
    Costs of filter 335:   652 ( 8.67s )
    Costs of filter 339:   694 ( 9.14s )
    Costs of filter 341:   650 ( 8.90s )
    Costs of filter 346:   527 ( 8.83s )
    Costs of filter 347:   719 ( 9.00s )
    Costs of filter 348:   547 ( 8.91s )
    Costs of filter 350:   560 ( 8.92s )
    Costs of filter 352:   584 ( 9.07s )
    Costs of filter 353:   541 ( 9.07s )
    Costs of filter 354:   576 ( 9.12s )
    Costs of filter 355:  1128 ( 9.13s )
    Costs of filter 356:  1252 ( 9.18s )
    Costs of filter 357:   423 ( 9.29s )
    Costs of filter 359:   764 ( 9.16s )
    Costs of filter 360:   445 ( 9.10s )
    Costs of filter 365:   525 ( 9.13s )
    Costs of filter 368:   931 ( 9.18s )
    Costs of filter 369:  1029 ( 9.20s )
    Costs of filter 371:  1283 ( 9.39s )
    Costs of filter 375:   960 ( 9.44s )
    Costs of filter 378:   567 ( 9.36s )
    Costs of filter 383:   832 ( 9.42s )
    Costs of filter 387:   922 ( 9.63s )
    Costs of filter 390:   699 ( 9.76s )
    Costs of filter 391:  1119 ( 9.57s )
    Costs of filter 394:  1023 ( 9.63s )
    Costs of filter 395:   689 ( 9.81s )
    Costs of filter 397:   555 ( 9.69s )
    Costs of filter 399:   570 ( 9.68s )
    Costs of filter 405:   822 ( 9.91s )
    Costs of filter 406:   585 ( 10.06s )
    Costs of filter 407:   914 ( 10.02s )
    Costs of filter 410:  1100 ( 10.09s )
    Costs of filter 411:   443 ( 10.06s )
    Costs of filter 418:  1082 ( 10.06s )
    Costs of filter 421:   524 ( 10.33s )
    Costs of filter 422:   892 ( 10.12s )
    Costs of filter 424:   353 ( 10.17s )
    Costs of filter 427:   977 ( 10.31s )
    Costs of filter 428:  1256 ( 10.49s )
    Costs of filter 431:   970 ( 10.43s )
    Costs of filter 432:  1419 ( 10.59s )
    Costs of filter 434:   600 ( 10.65s )
    Costs of filter 435:   647 ( 10.37s )
    Costs of filter 436:  1008 ( 10.40s )
    Costs of filter 437:   516 ( 10.39s )
    Costs of filter 438:   591 ( 10.63s )
    Costs of filter 442:   746 ( 10.46s )
    Costs of filter 446:   722 ( 10.58s )
    Costs of filter 447:  1298 ( 10.90s )
    Costs of filter 449:   389 ( 10.79s )
    Costs of filter 450:   653 ( 10.84s )
    Costs of filter 452:   527 ( 10.69s )
    Costs of filter 453:   617 ( 10.90s )
    Costs of filter 458:   593 ( 11.02s )
    Costs of filter 459:   912 ( 10.83s )
    Costs of filter 461:   302 ( 10.85s )
    Costs of filter 464:   450 ( 10.97s )
    Costs of filter 465:   652 ( 11.16s )
    Costs of filter 467:   687 ( 10.99s )
    Costs of filter 468:   467 ( 11.07s )
    Costs of filter 469:   996 ( 11.08s )
    Costs of filter 471:   840 ( 11.26s )
    Costs of filter 473:   772 ( 11.33s )
    Costs of filter 474:   698 ( 11.35s )
    Costs of filter 475:   588 ( 11.12s )
    Costs of filter 476:   589 ( 11.68s )
    Costs of filter 481:   697 ( 13.18s )
    Costs of filter 482:   541 ( 15.79s )
    Costs of filter 483:   527 ( 13.27s )
    Costs of filter 485:   713 ( 12.31s )
    Costs of filter 486:  1268 ( 12.75s )
    Costs of filter 487:   748 ( 11.81s )
    Costs of filter 489:   376 ( 11.90s )
    Costs of filter 490:   662 ( 11.93s )
    Costs of filter 491:   593 ( 12.19s )
    Costs of filter 493:   606 ( 14.47s )
    Costs of filter 494:   717 ( 15.14s )
    Costs of filter 496:   594 ( 14.02s )
    Costs of filter 497:   708 ( 12.83s )
    Costs of filter 500:   745 ( 12.17s )
    Costs of filter 502:  1269 ( 12.06s )
    Costs of filter 503:   615 ( 12.31s )
    Costs of filter 505:   655 ( 12.59s )
    Costs of filter 511:   568 ( 14.09s )
    234 filter processed.



```python

```

最终得到结果如下:
![卷积可视化图](https://cdn.jsdelivr.net/gh/ZhengWG/Imgs_blog/Keras-exercise/vgg_block5_conv1_15x15.png)
