---
layout: post
title: Kaggle-Digit Recognizer-svm
date: 2019-01-22 20:25:24.000000000 +09:00
tags: Kaggle; Digit Recognizer; svm
---

> [参考网页](https://www.kaggle.com/archaeocharlie/a-beginner-s-approach-to-classification)

```python
import pandas as pd
import matplotlib.pyplot as plt, matplotlib.image as mpimg
from sklearn.model_selection import train_test_split
from sklearn import svm
%matplotlib inline
```


```python
labeled_images = pd.read_csv('../input/train.csv')
images = labeled_images.iloc[0:5000,1:]
labels = labeled_images.iloc[0:5000,:1]
train_images, test_images,train_labels, test_labels = train_test_split(images, labels, train_size=0.8, random_state=0)
```

    /usr/local/lib/python3.5/dist-packages/sklearn/model_selection/_split.py:2179: FutureWarning: From version 0.21, test_size will always complement train_size unless both are specified.
      FutureWarning)



```python
i=1
img=train_images.iloc[i].as_matrix()
img=img.reshape((28,28))
plt.imshow(img,cmap='gray')
plt.title(train_labels.iloc[i,0])
```

    /usr/local/lib/python3.5/dist-packages/ipykernel_launcher.py:2: FutureWarning: Method .as_matrix will be removed in a future version. Use .values instead.
      





    Text(0.5, 1.0, '6')




![图片1](https://github.com/ZhengWG/Imgs_blog/raw/master/Kaggle_Digit%20Recognizer_svm/1.png)



```python
plt.hist(train_images.iloc[i])
```




    (array([682.,   9.,  10.,   7.,  10.,  18.,   7.,  17.,   7.,  17.]),
     array([  0. ,  25.5,  51. ,  76.5, 102. , 127.5, 153. , 178.5, 204. ,
            229.5, 255. ]),
     <a list of 10 Patch objects>)




![图片2](https://github.com/ZhengWG/Imgs_blog/raw/master/Kaggle_Digit%20Recognizer_svm/2.png)



```python
clf = svm.SVC()
clf.fit(train_images, train_labels.values.ravel())
clf.score(test_images,test_labels)
```

    /usr/local/lib/python3.5/dist-packages/sklearn/svm/base.py:196: FutureWarning: The default value of gamma will change from 'auto' to 'scale' in version 0.22 to account better for unscaled features. Set gamma explicitly to 'auto' or 'scale' to avoid this warning.
      "avoid this warning.", FutureWarning)





    0.1




```python
test_images[test_images>0]=1
train_images[train_images>0]=1

img=train_images.iloc[i].as_matrix().reshape((28,28))
plt.imshow(img,cmap='binary')
plt.title(train_labels.iloc[i].to_string())
```

    /usr/local/lib/python3.5/dist-packages/ipykernel_launcher.py:1: SettingWithCopyWarning: 
    A value is trying to be set on a copy of a slice from a DataFrame.
    Try using .loc[row_indexer,col_indexer] = value instead
    
    See the caveats in the documentation: http://pandas.pydata.org/pandas-docs/stable/indexing.html#indexing-view-versus-copy
      """Entry point for launching an IPython kernel.
    /usr/local/lib/python3.5/dist-packages/pandas/core/frame.py:3163: SettingWithCopyWarning: 
    A value is trying to be set on a copy of a slice from a DataFrame
    
    See the caveats in the documentation: http://pandas.pydata.org/pandas-docs/stable/indexing.html#indexing-view-versus-copy
      self._where(-key, value, inplace=True)
    /usr/local/lib/python3.5/dist-packages/ipykernel_launcher.py:2: SettingWithCopyWarning: 
    A value is trying to be set on a copy of a slice from a DataFrame.
    Try using .loc[row_indexer,col_indexer] = value instead
    
    See the caveats in the documentation: http://pandas.pydata.org/pandas-docs/stable/indexing.html#indexing-view-versus-copy
      
    /usr/local/lib/python3.5/dist-packages/ipykernel_launcher.py:4: FutureWarning: Method .as_matrix will be removed in a future version. Use .values instead.
      after removing the cwd from sys.path.





    Text(0.5, 1.0, 'label    6')




![图片3](https://github.com/ZhengWG/Imgs_blog/raw/master/Kaggle_Digit%20Recognizer_svm/3.png)



```python
plt.hist(train_images.iloc[i])
```




    (array([668.,   0.,   0.,   0.,   0.,   0.,   0.,   0.,   0., 116.]),
     array([0. , 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1. ]),
     <a list of 10 Patch objects>)




![图片4](https://github.com/ZhengWG/Imgs_blog/raw/master/Kaggle_Digit%20Recognizer_svm/4.png)



```python
clf = svm.SVC()
clf.fit(train_images, train_labels.values.ravel())
clf.score(test_images,test_labels)
```

    /usr/local/lib/python3.5/dist-packages/sklearn/svm/base.py:196: FutureWarning: The default value of gamma will change from 'auto' to 'scale' in version 0.22 to account better for unscaled features. Set gamma explicitly to 'auto' or 'scale' to avoid this warning.
      "avoid this warning.", FutureWarning)





    0.887




```python
test_data=pd.read_csv('../input/test.csv')
test_data[test_data>0]=1
results=clf.predict(test_data[0:5000])
```


```python
results
```




    array([2, 0, 9, ..., 1, 7, 3])




```python
df = pd.DataFrame(results)
df.index.name='ImageId'
df.index+=1
df.columns=['Label']
df.to_csv('results.csv', header=True)
```
