# API 参考手册

## @Luna-Flow/linear-algebra/immut

### 类型别名 @immut

#### `IArray[T]` : `@immut/array.T[T]`

表示不可变的数组（用于存储矩阵和向量）。

---

### 结构体 @immut

#### `@immut/Vector[T]`

```moonbit
struct Vector[T] {
  data : IArray[T]
} derive(Eq)
```

**描述：**  
`@immut/Vector[T]`是一个不可变向量，派生了Eq实现，其中：

- `data` - 用于存储向量数据的一维不可变数组

---

#### `@immut/Matrix[T]`

```moonbit
struct Matrix[T] {
  row : Int
  col : Int
  data : IArray[T]
} derive(Eq)
```

**描述：**  
`@immut/Matrix[T]`是一个不可变矩阵，派生了Eq实现，其中：

- `row` - 矩阵的行数
- `col` - 矩阵的列数
- `data` - 用于存储矩阵数据的一维不可变数组

---

#### `@immut/Indexed[T]`

```moonbit
struct Indexed[T] {
  index : (Int) -> T
}
```

**描述：**  
`@immut/Indexed[T]`是一个基于函数式索引的不可变序列容器，为`@immut/Matrix[T]`提供类似二维数组实现的使用体验，其中：

- `index` - 索引映射规则函数，接收类型为`Int`的索引参数并返回对应位置类型为`T`的元素

---

### 函数介绍 @immut

#### `Matrix::from_2d_array` : `(arr : Array[Array[T]]) -> Matrix[T]`
**描述：**
从二维数组创建矩阵

**参数：**
- `arr : Array[Array[T]]` — 传入的二维数组

**返回值**
`Matrix[T]`：

- 返回 `Matrix` 类型的数据。

**示例：**

```moonbit
let m1 = Matrix::from_2d_array([[1, 2], [3, 4]])
```

---

## @Luna-Flow/linear-algebra/mutable

### 新类型 @mutable

#### `Vector[T]` : `Array[T]`

表示可变的向量

---

### 结构体 @mutable

#### `@mutable/Matrix[T]`

```moonbit
struct Matrix[T] {
  row : Int
  col : Int
  data : Array[T]
} derive(Eq)
```

**描述：**  
`@mutable/Matrix[T]`是一个可变矩阵，派生了Eq实现，其中：

- `row` - 矩阵的行数
- `col` - 矩阵的列数
- `data` - 用于存储矩阵数据的一维数组

---

#### `@mutable/Lens[T]`

```moonbit
struct Lens[T] {
  set : (Int, T) -> Unit
  get : (Int) -> T
}
```

**描述：​​**
`@mutable/Lens[T]`是一个基于索引的可变数据访问器，提供双向操作接口，为`@mutable/Matrix[T]`提供类似二维数组实现的使用体验，其中：

- `set` - 修改元素值的函数，接收类型为`Int`的索引和类型为`T`的值，直接修改底层数据
- `get` - 访问元素值的函数，接收类型为`Int`的索引并返回对应位置类型为`T`的元素

---

### fn_category

#### `fn_name` : `fn_signature`

**描述：**  
fn describe

**参数：**

- `para_name: para_type` — para meaning
- `para_name: para_type` — para meaning

**返回值**  
return_modifier `return_type`：

- return_describe
- return_describe

**示例：**

```moonbit
fn_e.g.
```

**注意事项：**

- fn_notice
- fn_notice
- fn_notice

---
