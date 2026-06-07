# 不可变线性代数(immut库)函数说明

<br>

## 目录

- [功能简介](#功能简介)
- [基本数据结构](#基本数据结构)
- [矩阵操作](#矩阵操作)
- [向量操作](#向量操作)
- [性能说明](#性能说明)

<br>

## 功能简介

本库使用[__MoonBit__](https://www.moonbitlang.cn)语言编写的，具有固定大小的线性代数函数库，在不可变库中分为 `immut/matrix.mbt` 和 `immut/vector.mbt` 两个文件，分别对应了 **矩阵** 和 **向量** 两种数据结构。

已经实现的功能有：
+ [矩阵的创建函数](#矩阵的创建函数)
+ [矩阵的运算](#矩阵的运算)
+ [矩阵的处理](#矩阵的处理)
+ [矩阵的输出](#矩阵的输出)
+ [行列式计算](#行列式计算)

<br>

+ [向量的创建函数](#向量的创建函数)
+ [向量的运算](#向量的运算)
+ [向量的处理](#向量的处理)
+ [向量的输出](#向量的输出)


<br>

## 基本数据结构

### 类型别名

```moonbit
typealias IArray[T] = @immut/array.T[T]
```

用来储存二维矩阵的数组类型。

### Matrix[T] 结构

```Matrix[T]``` 是本库中定义的矩阵结构，其中```T```是矩阵中元素的类型

```moonbit
struct Matrix[T] {
    row : Int,
    col : Int,
    data : IArray[T]
}
```

同时，在本库中，矩阵存储方式为 **行优先** 存储。

### Indexed[T] 结构

```Indexed[T]``` 是本库中定义的下标访问结构，其中 ```T``` 是矩阵中元素的类型

```moonbit
struct Indexed[T] {
    index : (Int) -> T
}
```

### Vector[T] 结构

```Vector[T]``` 是本库中定义的向量结构，其中 ```T``` 是向量中元素的类型

```moonbit
struct Vector[T] {
    data : IArray[T]
}
```

## 矩阵操作

### 矩阵的创建函数
#### ```Matrix::from_2d_array(arr : Array[Array[T]]) -> Matrix[T]```
**描述**：从二维数组创建矩阵

**传入参数**：```arr : Array[Array[T]]```

**返回**：```Matrix[T]```

**示例**：

```moonbit
let m1 = Matrix::from_2d_array([[1, 2], [3, 4]])
```

#### ```Matrix::new(row : Int, col : Int, elem : T) -> Matrix[T]```
**描述**：创建矩阵

**传入参数**：
- `row` ：矩阵的行数
- `col` ：矩阵的列数
- `elem` ：一个数，矩阵中所有元素的值

**返回**：```Matrix[T]```

**示例**：生成一个2x2的矩阵，矩阵中所有元素的值为1

```moonbit
let m1 = Matrix::new(2, 2, 1)
```

#### ```Matrix::make(row : Int, col : Int, f : (Int, Int) -> T) -> Matrix[T]```
**描述**：创建矩阵

**传入参数**：
- `row`： 矩阵的行数
- `col`： 矩阵的列数
- `f`： 一个函数，用于生成矩阵中的元素

**返回**：```Matrix[T]```

**示例**：生成一个2x2的矩阵，其中位于i行j列的元素为i+j

```moonbit
let m1 = Matrix::make(2, 2, fn(i, j) { i + j })
```

#### ```Matrix::identity(n : Int) -> Matrix[T]```
**描述**：创建单位矩阵

**传入参数**：`n`：矩阵的阶数

**返回**：```Matrix[T]```

**示例**：生成一个3x3的单位矩阵

```moonbit
let m2 = Matrix::identity(3)
```

#### ```Matrix::zero(n : Int) -> Matrix[T]```
**描述**：创建零矩阵

**传入参数**：`n`：矩阵的阶数

**返回**：```Matrix[T]```

**示例**：生成一个3x3的零矩阵

```moonbit
let m3 = Matrix::zero(3)
```

### 矩阵的运算

在immut库中，矩阵可以直接进行加减运算，也可以进行数乘运算，还可以进行矩阵乘法运算。比如：

```moonbit
let m1 = Matrix::new(2, 2, 1)
let m2 = Matrix::new(2, 2, 2)
let m3 = m1 + m2
let m4 = m1 - m2
let m5 = m1 * m2
let m6 = 2 * m1
```

需要注意的是，在矩阵乘法的时候，前者的列数必须与后者的行数相同。

#### ```Matrix::scale(cst : T) -> Matrix[T]```
**描述**：矩阵数乘

**传入参数**：`cst`：一个数，矩阵中所有元素的值

**返回**：```Matrix[T]```

**示例**：

```moonbit
let m1 = Matrix::new(2, 2, 1)
let m2 = m1.scale(2)
```

#### ```Matrix::add_constant(cst : T) -> Matrix[T]```
**描述**：矩阵加常数

**传入参数**：`cst`：一个数，矩阵中所有元素的值

**返回**：```Matrix[T]```

**示例**：

```moonbit
let m1 = Matrix::new(2, 2, 1)
let m2 = m1.add_constant(2)
```

### 矩阵的处理

#### ```Matrix::transpose() -> Matrix[T]```
**描述**：矩阵转置

**传入参数**：无

**返回**：```Matrix[T]```

**示例**：直接对矩阵进行转置

```moonbit
let m1 = Matrix::new(2, 2, 1)
let m2 = m1.transpose()
```

#### ```Matrix::adjoint() -> Matrix[T]```
**描述**：求矩阵的共轭矩阵

**传入参数**：无

**返回**：```Matrix[T]```

**示例**：

```moonbit
```

#### ```Matrix::null() -> Bool```
**描述**：判断矩阵是否为零矩阵

**传入参数**：无

**返回**：```Bool```

**示例**：

```moonbit
let m1 = Matrix::new(2, 2, 1)
let b = m1.null()
// false
```

#### ```Matrix::set(i : Int, j : Int, elem : T) -> Matrix[T]```
**描述**：设置矩阵中指定位置的元素

**传入参数**：
- `i`：矩阵的行数
- `j`：矩阵的列数
- `elem`：一个数，矩阵中所有元素的值

**返回**：```Matrix[T]```

**示例**：将矩阵中位于(0, 0)位置的元素设置为2

```moonbit
let m1 = Matrix::new(2, 2, 1)
let m2 = m1.set(0, 0, 2)
```

### 矩阵的输出

在immut库中，矩阵可以直接由`println`输出。

```moonbit
let m1 = Matrix::from_2d_array([[1, 2], [3, 4]])
println(m1)
// 输出矩阵m1
// 输出格式为：
// |1, 2|
// |3, 4|
```

### 行列式计算

#### ```Matrix::determinant() -> T```
**描述**：计算矩阵的行列式

**传入参数**：无

**返回**：```T```

**示例**：求一个2x2的矩阵的行列式

```moonbit
let m1 = Matrix::new(2, 2, 1)
let d = m1.determinant()
```

## 向量操作

### 向量的创建函数

#### ```Vector::from_array(arr : Array[T]) -> Vector[T]```
**描述**：从数组创建向量

**传入参数**：`arr`：一个数组，数组中元素的类型为 `T`

**返回**：`Vector[T]`

**示例**：

```moonbit
let v1 = Vector::from_array([1, 2, 3])
```

#### ```Vector::make(n : Int, elem : T) -> Vector[T]```
**描述**：创建向量

**传入参数**：
- `n`：向量的长度
- `elem`：一个数，向量中所有元素的值

**返回**：`Vector[T]`

**示例**：生成一个长度为3的向量，其中所有元素的值为1

```moonbit
let v1 = Vector::make(3, 1)
```

#### ```Vector::makei(n : Int, f : (Int) -> T) -> Vector[T]```
**描述**：创建向量

**传入参数**：
- `n`：向量的长度
- `f`：一个函数，用于生成向量中的元素

**返回**：`Vector[T]`

**示例**：生成一个长度为3的向量，其中位于i位置的元素为i

```moonbit
let v1 = Vector::makei(3, fn(i) { i })
```

### 向量的运算

#### 向量的基本四则运算

在immut库中，向量可以直接进行加减运算，也可以进行数乘运算。比如：

```moonbit
let v1 = Vector::make(3, 1)
let v2 = Vector::make(3, 2)
let v3 = v1 + v2
let v4 = v1 - v2
let v5 = 2 * v1 // 向量的左乘
let v6 = v1 * 2 // 向量的右乘
let v7 = v1 * v2 // 向量的点乘
```

需要注意的是，在向量点乘的时候，前者的长度必须与后者的长度相同。

#### ```Vector::right_scale(scalar : T) -> Vector[T]```
**描述**：向量右乘

**传入参数**：`cst`：一个数，向量中所有元素的值

**返回**：`Vector[T]`

**示例**：将向量中的所有元素都乘以2

```moonbit
let v1 = Vector::make(3, 1)
let v2 = v1.right_scale(2)
```

#### ```Vector::left_scale(scalar : T) -> Vector[T]```
**描述**：向量左乘

**传入参数**：`scalar`：一个数，向量中所有元素的值

**返回**：`Vector[T]`

**示例**：将向量中的所有元素都乘以2

```moonbit
let v1 = Vector::make(3, 1)
let v2 = v1.left_scale(2)
```

### 向量的处理

#### ```Vector::length() -> Int```
**描述**：获取向量的长度

**传入参数**：无

**返回**：`Int`

**示例**：获取向量的长度

```moonbit
let v1 = Vector::make(3, 1)
let l = v1.length()
```

#### ```Vector::set(i : Int, x : T) -> Vector[T]```
**描述**：设置向量中指定位置的元素

**传入参数**：
- `i`：向量的位置
- `x`：一个数，需要去更改的值

**返回**：`Vector[T]`

**示例**：将向量中位于0位置的元素设置为2

```moonbit
let v1 = Vector::make(3, 1)
let v2 = v1.set(0, 2)
```

#### ```Vector::lerp(self : Vector[T], other : Vector[T], alpha : T) -> Vector[T]```
**描述**：线性插值

**传入参数**：
- `self`：一个向量
- `other`：一个向量
- `alpha`：一个数，插值的系数

**返回**：`Vector[T]`

**示例**：将 `v1` 和 `v2` 线性插值

```moonbit
let v1 = Vector::make(3, 1)
let v2 = Vector::make(3, 2)
let v3 = Vector::lerp(v1, v2, 0.5)
```

#### ```Vector::scaled_matrix() -> Matrix[T]```
**描述**：生成一个对角矩阵

**传入参数**：无

**返回**：`Matrix[T]`

**示例**：将一个普通的向量转换为对角矩阵

```moonbit
let v1 = Vector::make(3, 1)
let m1 = v1.scaled_matrix()
```

#### ```Vector::tensor_product(self : Vector[T], other : Vector[T]) -> Matrix[T]```
**描述**：张量积

**传入参数**：
- `self`：一个向量
- `other`：一个向量

**返回**：`Matrix[T]`

**示例**：将两个向量进行张量积，生成一个 `m x n` 的矩阵

```moonbit
let v1 = Vector::make(3, 1)
let v2 = Vector::make(3, 2)
let m1 = Vector::tensor_product(v1, v2)
```

### 向量的输出

在immut库中，向量可以直接由`println`输出。

```moonbit
let v1 = Vector::make(3, 1)
println(v1)
// 输出向量v1
// 输出格式为：
// |1, 1, 1|
```

