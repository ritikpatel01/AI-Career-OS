// CPU reference fixtures exercise mechanics; they do not claim benchmark quality.
// Framework exercises require an installed dependency, never a downloaded dataset/model.
const task=(topic,difficulty,slug,title,prompt,objective,requirements,cases,hints,explanation,solution,checks,dependency='numpy')=>({
    id:`ai-dl-${slug}-v1`,career:'AI Engineer',phase:'Deep Learning',topic,title,difficulty,
    kind:'coding',language:'Python',estimatedTime:difficulty==='Easy'?'20–30 minutes':difficulty==='Medium'?'35–50 minutes':'50–90 minutes',
    problemStatement:prompt, simplerProblem:objective,
    learningObjectives:[objective,'Check the numerical or state-management boundary cases in the stated contract.'],
    prerequisites:[dependency==='torch'?'Python 3.10+ and CPU PyTorch 2.x':dependency==='tensorflow'?'Python 3.10+ and CPU TensorFlow 2.16+ (tf.keras)':'Python 3.10+ and NumPy 1.26+', 'Finite small CPU fixtures; no external datasets or pretrained downloads'],
    conceptsToReview:[topic,objective],requirements,
    examples:cases.map(([input,output])=>({input,output,explanation})),
    tests:cases.map(([input,expected],i)=>({name:`Acceptance case ${i+1}`,input,expected})),
    hints,approach:explanation,walkthrough:cases.map(([input,output])=>`${input} → ${output}`).join('\n')+'\n'+explanation,
    solutionCode:solution,solutionLines:[explanation,...hints],completionCriteria:requirements,
    starterCode:'# Implement the named function using the dependency and shape contract above.\n',
    commonMistakes:[],followUp:'Explain the stated algorithm’s memory or generalization limitation before using it on a production dataset.',
    referenceDependency:dependency,referenceChecks:checks
});

export const AI_DEEP_LEARNING_PRACTICE=[
    task('Neural Networks','Easy','dense-forward','Trace a batched dense layer',
        'Implement a dense neural-network layer followed by ReLU for a batch X shaped (N,D), weights W shaped (D,H), and bias b shaped (H,). Assume finite compatible numeric inputs. Return (N,H) activations without modifying inputs; include the zero and negative preactivation cases.',
        'Map batch and feature axes through an affine transformation and activation.',
        ['Compute X@W+b and apply elementwise max(z,0).','Preserve the batch dimension, including a zero-row batch.'],
        [['X=[[1,-1]], W=[[2,1],[1,3]], b=[0,1]','[[1,0]]'],['X has shape (0,2), W shape (2,3)','Output shape (0,3)']],
        ['Matrix multiplication contracts the input feature axis.','Bias broadcasts over rows; ReLU is elementwise.'],
        'A dense layer shares one parameter matrix across the batch. ReLU retains positive preactivations and suppresses negative ones; it does not normalize probabilities. Batch shape should survive even when only one example is supplied.',
        String.raw`import numpy as np
def dense_relu(x,w,b):
    return np.maximum(np.asarray(x,dtype=float)@np.asarray(w,dtype=float)+np.asarray(b,dtype=float),0)`,
        String.raw`assert np.allclose(dense_relu([[1,-1]],[[2,1],[1,3]],[0,1]),[[1,0]])
assert dense_relu(np.empty((0,2)),np.zeros((2,3)),np.zeros(3)).shape==(0,3)`),
    task('Neural Networks','Easy','stable-sigmoid','Avoid overflow in binary activations',
        'Implement sigmoid for finite scalar or array inputs without evaluating exp of a large positive number. Preserve array shape, return values in [0,1], and handle logits -1000, 0, and 1000 under a floating-point overflow exception policy.',
        'Compute a saturation-prone activation with a numerically stable branch.',
        ['Use separate nonnegative and negative formulas with indexed branches.','Do not use np.where with two eagerly evaluated exponential expressions.'],
        [['Logits [-1000,0,1000]','Approximately [0,0.5,1] without overflow'],['Logit 0','Scalar-shaped result 0.5']],
        ['For a negative z, exp(z)/(1+exp(z)) avoids exp(-z).','Both branches must evaluate only their own selected elements.'],
        'The sigmoid formulas are algebraically equivalent but not numerically interchangeable at extreme magnitudes. Saturation still produces tiny derivatives even when overflow is prevented, which matters for gradient flow in deeper networks.',
        String.raw`import numpy as np
def stable_sigmoid(values):
    z=np.asarray(values,dtype=float); result=np.empty_like(z); positive=z>=0
    result[positive]=1/(1+np.exp(-z[positive]))
    e=np.exp(z[~positive]); result[~positive]=e/(1+e)
    return result`,
        String.raw`with np.errstate(over='raise',invalid='raise'):
    assert np.allclose(stable_sigmoid([-1000,0,1000]),[0,0.5,1])
assert stable_sigmoid(0).shape==() and stable_sigmoid(0)==0.5`),
    task('Neural Networks','Easy','logit-cross-entropy','Compute multiclass loss directly from logits',
        'Implement mean multiclass cross-entropy for nonempty finite logits shaped (N,C) and integer labels (N,) in [0,C). Use a stable log-sum-exp calculation rather than taking logs of rounded softmax probabilities. Assume shape and label contracts hold.',
        'Match an unnormalized multiclass output to a stable classification loss.',
        ['Subtract the row maximum before exponentiation.','Return the average negative log probability of each actual class.'],
        [['Logits [[0,0]], label [1]','log(2)'],['Logits [[1000,-1000]], label [0]','Approximately zero and finite']],
        ['logsumexp(z)−z[target] is the row loss.','A common additive shift of every class logit cannot change the loss.'],
        'Cross-entropy compares the target class against the log-normalizer of all logits. Max subtraction avoids exponential overflow and preserves additive-shift invariance. Passing probabilities where logits are expected applies the wrong objective.',
        String.raw`import numpy as np
def multiclass_loss(logits,labels):
    z=np.asarray(logits,dtype=float); y=np.asarray(labels,dtype=int)
    shifted=z-z.max(axis=1,keepdims=True)
    return float(np.mean(np.log(np.exp(shifted).sum(axis=1))-shifted[np.arange(len(y)),y]))`,
        String.raw`assert np.isclose(multiclass_loss([[0,0]],[1]),np.log(2))
assert multiclass_loss([[1000,-1000]],[0])==0
assert np.isclose(multiclass_loss([[2,1]],[1]),multiclass_loss([[102,101]],[1]))`),
    task('Neural Networks','Medium','relu-backward','Backpropagate through a dense ReLU block',
        'Given finite compatible X, W, b and upstream gradient G for Y=ReLU(XW+b), return gradients dX,dW,db. Adopt derivative zero at preactivation zero. G already includes any loss averaging, so do not divide by batch size again.',
        'Apply the chain rule and accumulate shared bias gradients correctly.',
        ['Gate the upstream gradient with preactivation > 0.','Sum bias gradients across rows and return gradients in parameter shapes.'],
        [['X=[[1]], W=[[2]], b=[0], G=[[3]]','dX=[[6]], dW=[[3]], db=[3]'],['Zero preactivation','All local gradients zero']],
        ['First calculate dZ=G*(Z>0).','Matrix derivatives are dX=dZ@W.T and dW=X.T@dZ.'],
        'Backpropagation transports a vector-Jacobian product without materializing full Jacobians. Shared bias parameters receive a sum across examples. An extra averaging step would silently scale gradients twice if the upstream loss already used a mean.',
        String.raw`import numpy as np
def dense_relu_backward(x,w,b,g):
    x,w,b,g=[np.asarray(v,dtype=float) for v in (x,w,b,g)]
    dz=g*((x@w+b)>0)
    return dz@w.T,x.T@dz,dz.sum(axis=0)`,
        String.raw`dx,dw,db=dense_relu_backward([[1]],[[2]],[0],[[3]])
assert np.allclose(dx,[[6]]) and np.allclose(dw,[[3]]) and np.allclose(db,[3])
assert all(np.allclose(v,0) for v in dense_relu_backward([[0]],[[2]],[0],[[3]]))`),
    task('Neural Networks','Medium','inverted-dropout','Apply training-only inverted dropout',
        'Implement inverted dropout for a finite floating array, probability p in [0,1), and seed. During training independently retain entries with probability 1-p and divide retained values by 1-p. During evaluation return a copy without random masking. Reject invalid probabilities.',
        'Distinguish stochastic regularization from deterministic inference.',
        ['Use np.random.default_rng(seed) and keep masks reproducible.','Never mutate inputs; evaluation must preserve values exactly.'],
        [['All ones, p=0.5 during training','Each output is 0 or 2'],['Any array at evaluation','An unchanged copy regardless of seed']],
        ['Inverted scaling keeps the expected activation unchanged.','Evaluation disables this transformation rather than multiplying by keep probability again.'],
        'Dropout samples a random subnetwork during training and preserves activation expectation through inverted scaling. The reference checks the contract rather than claiming one small random mask has an exactly balanced keep count. Validation and test inference disable dropout.',
        String.raw`import numpy as np
def inverted_dropout(x,p,training,seed):
    if not np.isfinite(p) or not 0<=p<1: raise ValueError('Require 0 <= p < 1')
    x=np.asarray(x,dtype=float)
    if not training: return x.copy()
    mask=np.random.default_rng(seed).random(x.shape)>=p
    return x*mask/(1-p)`,
        String.raw`x=np.ones(100); a=inverted_dropout(x,0.5,True,2)
assert set(np.unique(a))=={0,2} and np.array_equal(a,inverted_dropout(x,0.5,True,2))
z=inverted_dropout(x,0.5,False,3); assert np.array_equal(z,x) and not np.shares_memory(z,x)
try: inverted_dropout(x,1,True,0)
except ValueError: pass
else: raise AssertionError('invalid p')`),
    task('Neural Networks','Medium','global-gradient-clip','Clip a collection by global gradient norm',
        'Implement global L2 gradient clipping for a nonempty list of finite gradient arrays and a positive finite max_norm. Return new arrays scaled by the same factor min(1,max_norm/global_norm). Preserve zero gradients and do not clip each tensor independently.',
        'Control a full update direction while preserving relative tensor magnitudes.',
        ['Compute one norm across all tensor entries.','Return copies when clipping is unnecessary and reject invalid max_norm.'],
        [['Gradients [array([3]),array([4])], max_norm=2.5','[array([1.5]),array([2])]'],['All-zero gradients','Unchanged finite zero arrays']],
        ['Add squared norms before taking the square root.','Guard a zero norm before dividing.'],
        'Global norm clipping rescales the complete gradient direction, unlike elementwise clipping. It can mitigate exploding updates but does not solve vanishing gradients or justify an unstable learning rate. These fixtures assume moderate finite magnitudes whose squares fit in float64.',
        String.raw`import numpy as np
def clip_global(gradients,max_norm):
    if not np.isfinite(max_norm) or max_norm<=0: raise ValueError('Positive finite limit required')
    arrays=[np.asarray(g,dtype=float) for g in gradients]
    norm=np.sqrt(sum(np.sum(g*g) for g in arrays))
    scale=min(1.0,max_norm/norm) if norm else 1.0
    return [g*scale for g in arrays]`,
        String.raw`a,b=clip_global([[3],[4]],2.5); assert np.allclose(a,[1.5]) and np.allclose(b,[2])
assert np.array_equal(clip_global([[0,0]],1)[0],[0,0])
try: clip_global([[1]],0)
except ValueError: pass
else: raise AssertionError('invalid norm limit')`),
    task('Neural Networks','Hard','two-layer-gradient','Verify a two-layer network gradient numerically',
        'For scalar-output predictions tanh(XW1+b1)@W2+b2, implement mean squared loss and analytical gradients for all four parameters. Assume nonempty finite compatible arrays with W2 shaped (H,1), b2 shaped (1,), and y shaped (N,1). Verify all gradients using central finite differences.',
        'Backpropagate a mean loss through two parameterized layers.',
        ['Differentiate mean((prediction-y)^2) with its factor 2/N.','Return loss and gradients [dW1,db1,dW2,db2] without changing parameters.'],
        [['A small two-example two-hidden-unit network','Every numerical gradient matches within 1e-5'],['Predictions exactly equal targets','Zero loss and zero gradients']],
        ['Cache the tanh activation for derivative 1-h².','Test every parameter entry, not only the last layer.'],
        'Finite differences compare the implemented gradient to the exact stated objective. Bias reductions and the mean-loss normalization are frequent sources of bugs. Tiny deterministic fixtures support diagnosis but do not establish that an optimizer will generalize.',
        String.raw`import numpy as np
def two_layer_gradients(x,y,w1,b1,w2,b2):
    h=np.tanh(x@w1+b1); error=h@w2+b2-y
    dp=2*error/len(x); dh=(dp@w2.T)*(1-h*h)
    return float(np.mean(error**2)),[x.T@dh,dh.sum(axis=0),h.T@dp,dp.sum(axis=0)]`,
        String.raw`x=np.array([[0.2,-0.1],[0.7,0.3]]); y=np.array([[0.4],[-0.2]])
params=[np.array([[0.1,0.2],[-0.3,0.4]]),np.array([0.1,-0.1]),np.array([[0.2],[-0.4]]),np.array([0.3])]
loss,gradients=two_layer_gradients(x,y,*params)
for p,g in zip(params,gradients):
    for index in np.ndindex(p.shape):
        old=p[index]; p[index]=old+1e-6; plus=two_layer_gradients(x,y,*params)[0]
        p[index]=old-1e-6; minus=two_layer_gradients(x,y,*params)[0]; p[index]=old
        assert np.isclose(g[index],(plus-minus)/2e-6,atol=1e-5)
pred=np.tanh(x@params[0]+params[1])@params[2]+params[3]
assert two_layer_gradients(x,pred,*params)[0]==0`),
    task('Neural Networks','Hard','adam-update','Implement a bias-corrected Adam step',
        'Implement one Adam update for equal-shaped finite parameter, gradient, first-moment, and second-moment arrays. Use standard beta1=0.9, beta2=0.999, epsilon=1e-8 and a positive one-based step t. Return updated parameters and uncorrected running moments without mutating inputs.',
        'Track optimizer state and distinguish bias-corrected estimates from stored moments.',
        ['Correct moments by 1−beta^t only when calculating the parameter update.','Place epsilon outside sqrt(v_hat) and reject a nonpositive step or learning rate.'],
        [['Initial parameter 1, gradient 2, zero moments, t=1, lr=0.1','Parameter approximately 0.9; stored m=0.2, v=0.004'],['Zero gradient and zero moments','Parameter unchanged']],
        ['The first-step corrected moments should equal g and g².','Store raw running averages so subsequent steps do not double-correct them.'],
        'Adam combines a first-moment direction with a second-moment scale and corrects initialization bias. Its state must accompany parameters when resuming training. This exercise implements basic Adam, without decoupled weight decay or AMSGrad.',
        String.raw`import numpy as np
def adam_step(parameter,gradient,m,v,t,lr):
    if type(t) is not int or t<1 or not np.isfinite(lr) or lr<=0: raise ValueError('Invalid step/rate')
    m_new=0.9*m+0.1*gradient; v_new=0.999*v+0.001*gradient**2
    updated=parameter-lr*(m_new/(1-0.9**t))/(np.sqrt(v_new/(1-0.999**t))+1e-8)
    return updated,m_new,v_new`,
        String.raw`p=np.array([1.]); z=np.zeros(1)
u,m,v=adam_step(p,np.array([2.]),z,z,1,0.1)
assert np.allclose(u,[0.9]) and np.allclose(m,[0.2]) and np.allclose(v,[0.004]) and p[0]==1
assert np.array_equal(adam_step(p,z,z,z,1,0.1)[0],p)`),
    task('Neural Networks','Hard','early-stop-state','Track validation patience and best checkpoints',
        'Implement a pure early-stopping controller over finite validation losses using positive integer patience and nonnegative min_delta. The first loss initializes the best checkpoint; improvement means loss < best−min_delta. Return the best epoch and zero-based stopping epoch, or None when patience never expires. Do not use final test losses for this decision.',
        'Separate validation-driven stopping decisions from final evaluation and checkpoint restoration.',
        ['Reset the consecutive nonimprovement counter only on sufficient improvement.','Return indices, not trained weights; the caller must snapshot and restore the associated best model state.'],
        [['Losses [3,2,2,2], patience=2, min_delta=0','Best epoch 1, stop epoch 3'],['Losses [3,2,1], patience=2','Best epoch 2, stop None']],
        ['An equal loss is not a strict improvement.','A parameter reference is not a snapshot when training keeps mutating it.'],
        'Early stopping is a model-selection rule driven by validation. The model at the stopping epoch can be worse than the best checkpoint, so restoration is a separate requirement. The loss policy must be defined before inspecting final test results.',
        String.raw`import numpy as np
def early_stop(losses,patience,min_delta=0.0):
    if type(patience) is not int or patience<1 or not np.isfinite(min_delta) or min_delta<0 or not len(losses) or not np.isfinite(losses).all(): raise ValueError('Invalid stopping inputs')
    best=float('inf'); best_epoch=None; bad=0
    for epoch,loss in enumerate(losses):
        if loss<best-min_delta: best=loss; best_epoch=epoch; bad=0
        else: bad+=1
        if bad>=patience: return best_epoch,epoch
    return best_epoch,None`,
        String.raw`assert early_stop([3,2,2,2],2)==(1,3)
assert early_stop([3,2,1],2)==(2,None)
assert early_stop([1,0.95,0.8],1,0.1)==(0,1)`),
    task('PyTorch','Easy','torch-broadcast','Normalize a tensor without losing its batch axis',
        'Using CPU PyTorch 2.x, normalize each feature of a floating tensor x shaped (N,D) by supplied training means and positive training standard deviations shaped (D,). Return a new tensor on the same device and dtype. Do not estimate statistics from the prediction batch.',
        'Use tensor broadcasting while retaining training-only preprocessing state.',
        ['Compute (x−mean)/std with feature-wise broadcasting.','Preserve shape, dtype, and input values; assume compatible finite tensors and positive std.'],
        [['x=[[1,10],[3,14]], mean=[1,10], std=[2,4]','[[0,0],[1,1]]'],['An empty (0,D) batch','Output shape remains (0,D)']],
        ['Statistics broadcast along rows rather than columns.','Keep means and scales on the input device before arithmetic.'],
        'PyTorch broadcasting applies one training-fitted transform to every row. Explicit dtype/device conversion prevents accidental device mismatches. In a deployed module, such fixed statistics can be registered as buffers so model movement and serialization include them.',
        String.raw`import torch
def normalize_tensor(x,mean,std):
    mean=torch.as_tensor(mean,dtype=x.dtype,device=x.device)
    std=torch.as_tensor(std,dtype=x.dtype,device=x.device)
    return (x-mean)/std`,
        String.raw`x=torch.tensor([[1.,10.],[3.,14.]],dtype=torch.float64); before=x.clone()
z=normalize_tensor(x,[1,10],[2,4])
assert torch.allclose(z,torch.tensor([[0.,0.],[1.,1.]],dtype=x.dtype)) and z.dtype==x.dtype
assert torch.equal(x,before) and normalize_tensor(x[:0],[1,10],[2,4]).shape==(0,2)`,'torch'),
    task('PyTorch','Easy','torch-autograd','Calculate and isolate an autograd derivative',
        'Implement a CPU PyTorch helper that computes the gradient of sum(x³) with respect to an independent floating input tensor. Clone and detach the input before enabling gradients so the caller’s gradient state is unchanged. Return a detached gradient tensor, not a graph-connected result.',
        'Create a leaf tensor and use reverse-mode automatic differentiation deliberately.',
        ['Use a cloned detached leaf with requires_grad enabled.','Return 3*x² and leave the caller’s .grad untouched.'],
        [['Input [-2,0,3]','Gradient [12,0,27]'],['Caller requires gradients','Its .grad remains None']],
        ['A scalar reduction provides the starting point for backward.','Reading .grad is reliable on the newly created leaf.'],
        'Autograd tracks operations on tensors requiring gradients, and backward accumulates into leaf gradients. An independent detached clone avoids accumulating into a caller’s ongoing graph. Detaching the returned result makes the API’s no-higher-order-gradient contract explicit.',
        String.raw`import torch
def cubic_gradient(x):
    leaf=x.detach().clone().requires_grad_(True)
    (leaf**3).sum().backward()
    return leaf.grad.detach().clone()`,
        String.raw`x=torch.tensor([-2.,0.,3.],requires_grad=True)
g=cubic_gradient(x)
assert torch.equal(g,torch.tensor([12.,0.,27.])) and not g.requires_grad and x.grad is None
assert cubic_gradient(torch.tensor([0.])).item()==0`,'torch'),
    task('PyTorch','Easy','torch-linear-model','Build a logits-producing classifier module',
        'Create a CPU PyTorch binary classifier accepting (N,3) inputs and returning raw logits shaped (N,1). Use Linear(3,4), ReLU, Linear(4,1), with no sigmoid in the model because the training contract uses BCEWithLogitsLoss. Return an nn.Module whose parameters are registered.',
        'Align a network output contract with its numerically stable loss.',
        ['Use registered nn layers and return raw logits.','Retain both batch and singleton output axes.'],
        [['Five rows with three features','Logit shape (5,1)'],['Zero all parameters','Every output logit equals zero']],
        ['nn.Sequential registers the parameters automatically.','BCEWithLogitsLoss already incorporates the sigmoid mathematically.'],
        'A logits-based model avoids a redundant sigmoid before the fused binary loss. At inference a sigmoid converts logits to probabilities and a separately chosen threshold makes decisions. Keeping the final axis avoids surprising one-row squeeze behavior.',
        String.raw`import torch
from torch import nn
def binary_network():
    return nn.Sequential(nn.Linear(3,4),nn.ReLU(),nn.Linear(4,1))`,
        String.raw`m=binary_network(); assert m(torch.zeros(5,3)).shape==(5,1)
assert sum(p.numel() for p in m.parameters())==21
with torch.no_grad():
    for p in m.parameters(): p.zero_()
assert torch.equal(m(torch.ones(1,3)),torch.zeros(1,1))`,'torch'),
    task('PyTorch','Medium','torch-epoch','Train over a short final minibatch correctly',
        'Implement one CPU PyTorch regression epoch for an existing model, DataLoader, and optimizer. Each loader item is (x,y), with one scalar target per example shaped (N,1). Clear gradients each batch, minimize mean squared error, and return example-weighted epoch MSE measured before each batch update. Reject an empty loader.',
        'Manage training mode, gradient lifecycle, and uneven-batch metric aggregation.',
        ['Call model.train(), zero_grad, backward, and optimizer.step for each batch.','Weight batch losses by row count rather than averaging batch means equally.'],
        [['Batch errors squared [1,1] then [9], learning rate zero','Epoch MSE 11/3'],['No batches','ValueError']],
        ['A two-row batch and a one-row batch have different metric weights.','zero_grad(set_to_none=True) prevents accumulation across ordinary updates.'],
        'Training mode enables training behavior in dropout and normalization layers. The returned loss aggregates predictions from successive model states, so it is a training diagnostic rather than a frozen-model evaluation. Held-out scoring belongs in a separate inference pass.',
        String.raw`import torch
def regression_epoch(model,loader,optimizer):
    model.train(); total=0.0; count=0
    for x,y in loader:
        optimizer.zero_grad(set_to_none=True)
        loss=torch.nn.functional.mse_loss(model(x),y)
        loss.backward(); optimizer.step()
        total+=loss.detach().item()*len(x); count+=len(x)
    if not count: raise ValueError('Empty loader')
    return total/count`,
        String.raw`from torch.utils.data import TensorDataset,DataLoader
m=torch.nn.Linear(1,1,bias=False)
with torch.no_grad(): m.weight.zero_()
loader=DataLoader(TensorDataset(torch.zeros(3,1),torch.tensor([[1.],[1.],[3.]])),batch_size=2)
assert abs(regression_epoch(m,loader,torch.optim.SGD(m.parameters(),lr=0))-11/3)<1e-6
try: regression_epoch(m,[],torch.optim.SGD(m.parameters(),lr=0.1))
except ValueError: pass
else: raise AssertionError('empty loader')`,'torch'),
    task('PyTorch','Medium','torch-loader','Pair a deterministic dataset and loader',
        'Implement a CPU PyTorch DataLoader factory for aligned feature and target tensors. Use TensorDataset, batch_size=2, shuffle=False, drop_last=False, and num_workers=0 so every original example is returned once in order, including a short last batch. Reject differing row counts.',
        'Maintain feature-target alignment through batching.',
        ['Reject misaligned tensors before constructing the dataset.','Return a loader that retains the final incomplete batch.'],
        [['Five feature rows and five targets','Batch lengths [2,2,1] with unchanged order'],['Three features and two targets','ValueError']],
        ['TensorDataset indexes all tensors together.','A deterministic validation loader makes coverage checks straightforward.'],
        'A DataLoader defines iteration and batching while the dataset defines paired observations. Shuffling is usually useful in IID training, but this explicit nonshuffled factory is suitable for reproducible coverage and evaluation. It does not replace group-aware or temporal dataset splitting.',
        String.raw`from torch.utils.data import TensorDataset,DataLoader
def paired_loader(x,y):
    if len(x)!=len(y): raise ValueError('Mismatched rows')
    return DataLoader(TensorDataset(x,y),batch_size=2,shuffle=False,drop_last=False,num_workers=0)`,
        String.raw`x=torch.arange(5).reshape(-1,1); y=torch.arange(5)*10
batches=list(paired_loader(x,y)); assert [len(a) for a,b in batches]==[2,2,1]
assert torch.equal(torch.cat([b for a,b in batches]),y)
try: paired_loader(x,y[:2])
except ValueError: pass
else: raise AssertionError('misaligned')`,'torch'),
    task('PyTorch','Medium','torch-evaluation','Evaluate without changing normalization statistics',
        'Implement an inference helper for a PyTorch model and input batch. Temporarily set evaluation mode, run under torch.no_grad(), and restore every submodule’s previous training flag even if forward raises. This must support a model with deliberately mixed train/eval submodules.',
        'Distinguish disabling gradients from disabling training-layer behavior.',
        ['Use both eval mode and no_grad for inference.','Restore all original module flags in a finally block.'],
        [['A model containing dropout and BatchNorm','No gradient graph; BatchNorm running means unchanged'],['A child was already in eval mode','Its flag remains false after the call']],
        ['no_grad alone does not turn off dropout or BatchNorm updates.','Save each module’s flag before calling eval, which acts recursively.'],
        'Evaluation behavior and gradient recording are separate controls. Restoring only the root flag can erase intentionally mixed states, such as a frozen feature extractor. The helper restores flags directly; modules with custom train side effects may need a richer state-management protocol.',
        String.raw`import torch
def evaluate_batch(model,x):
    modes=[(module,module.training) for module in model.modules()]
    try:
        model.eval()
        with torch.no_grad(): return model(x)
    finally:
        for module,mode in modes: module.training=mode`,
        String.raw`m=torch.nn.Sequential(torch.nn.BatchNorm1d(2),torch.nn.Dropout(0.5)); m.train(); m[0].eval()
before=m[0].running_mean.clone(); out=evaluate_batch(m,torch.ones(3,2,requires_grad=True))
assert not out.requires_grad and torch.equal(before,m[0].running_mean)
assert m.training and not m[0].training and m[1].training
class Broken(torch.nn.Module):
    def forward(self,x): raise RuntimeError('fixture')
b=Broken()
try: evaluate_batch(b,torch.ones(1))
except RuntimeError: pass
assert b.training`,'torch'),
    task('PyTorch','Hard','torch-accumulation','Accumulate an uneven effective batch exactly',
        'Implement one optimizer update over a nonempty list of CPU minibatches, with scalar regression outputs shaped (N,1). Make the accumulated gradient equal the mean squared error over all examples, even when minibatch sizes differ. Clear once, backpropagate each batch sum divided by total examples, and step once. Assume no stochastic or batch-dependent layers.',
        'Match gradient accumulation to a full effective-batch objective.',
        ['Normalize each sum loss by the total example count, not by number of minibatches.','Update optimizer parameters once and reject zero total examples.'],
        [['A full batch split into sizes 2 and 1','Same SGD update as an unsplit mean loss'],['Empty batch list','ValueError']],
        ['Loss reduction=sum allows a consistent global denominator.','Dropout and BatchNorm can prevent exact equivalence to one concatenated forward pass.'],
        'Gradient accumulation adds vector-Jacobian products, so the denominator must describe the complete effective batch. Averaging already averaged minibatch losses equally overweights short batches. This reference assumes a single scalar target and no per-batch state changes.',
        String.raw`import torch
def accumulated_update(model,batches,optimizer):
    n=sum(len(x) for x,y in batches)
    if not n: raise ValueError('Empty effective batch')
    model.train(); optimizer.zero_grad(set_to_none=True)
    for x,y in batches:
        if len(x): (torch.nn.functional.mse_loss(model(x),y,reduction='sum')/n).backward()
    optimizer.step()`,
        String.raw`import copy
a=torch.nn.Linear(1,1); b=copy.deepcopy(a); x=torch.tensor([[1.],[2.],[4.]]); y=2*x
opt=torch.optim.SGD(a.parameters(),lr=0.1); opt.zero_grad(); torch.nn.functional.mse_loss(a(x),y).backward(); opt.step()
accumulated_update(b,[(x[:2],y[:2]),(x[2:],y[2:])],torch.optim.SGD(b.parameters(),lr=0.1))
assert all(torch.allclose(p,q,atol=1e-6) for p,q in zip(a.parameters(),b.parameters()))
try: accumulated_update(b,[],torch.optim.SGD(b.parameters(),lr=0.1))
except ValueError: pass
else: raise AssertionError('empty effective batch')`,'torch'),
    task('PyTorch','Hard','torch-padding-loss','Ignore padded sequence targets in the loss',
        'Implement a token classification loss for PyTorch logits (B,T,C), long targets (B,T), and boolean valid mask (B,T). Compute mean cross-entropy over valid positions only. If none are valid return a differentiable zero connected to logits. Invalid-position target values may be outside the class range.',
        'Exclude padding from both loss values and gradients.',
        ['Index valid positions before cross_entropy to avoid invalid padding labels.','An all-padding batch must backpropagate zero rather than NaN or a detached constant.'],
        [['One valid token and one invalid padding target 999','Loss equals the single valid token’s loss'],['No valid tokens','Zero loss with zero logits gradients']],
        ['Masking losses after computing them still exposes invalid target indices.','logits.sum()*0 preserves an autograd connection for an empty valid set.'],
        'Padding is a batching artifact and should not change the training objective. Averaging only valid tokens defines token-weighted rather than sequence-weighted loss; choose the weighting policy explicitly. The input mask must match the task’s true supervised positions.',
        String.raw`import torch
def valid_token_loss(logits,targets,valid):
    if not valid.any(): return logits.sum()*0
    return torch.nn.functional.cross_entropy(logits[valid],targets[valid])`,
        String.raw`z=torch.zeros(1,2,3,requires_grad=True); y=torch.tensor([[1,999]]); mask=torch.tensor([[True,False]])
loss=valid_token_loss(z,y,mask); assert abs(loss.item()-float(torch.log(torch.tensor(3.))))<1e-6
loss.backward(); assert torch.equal(z.grad[0,1],torch.zeros(3))
z2=torch.ones(1,2,3,requires_grad=True); loss=valid_token_loss(z2,y,torch.zeros_like(mask)); loss.backward()
assert loss.item()==0 and torch.equal(z2.grad,torch.zeros_like(z2))`,'torch'),
    task('PyTorch','Hard','torch-snapshot','Capture an independent resumable training snapshot',
        'Return an in-memory snapshot containing a PyTorch model state_dict, optimizer state_dict, and nonnegative integer epoch. The snapshot must be independent of later parameter and optimizer mutations. Include optimizer moments after an Adam update. Do not serialize or load untrusted pickle files.',
        'Preserve model and optimizer state at one exact training boundary.',
        ['Deep-copy both state dictionaries; do not retain live tensor references.','Store the epoch and verify a fresh compatible model and optimizer can load both dictionaries.'],
        [['Snapshot, then overwrite live model parameters','Saved tensors remain unchanged'],['Load snapshot into a compatible new Adam optimizer','Moment tensors and step state are restored']],
        ['state_dict returns a mapping whose tensors can still share storage.','Exact reproducibility may additionally require RNG, sampler, scheduler, scaler, and data-position state.'],
        'Parameters alone are insufficient to resume adaptive optimization. An independent checkpoint includes optimizer state at the same boundary, while exact run replay needs more context than this scoped snapshot. This exercise keeps data in memory and avoids unsafe file deserialization.',
        String.raw`import copy
def training_snapshot(model,optimizer,epoch):
    if type(epoch) is not int or epoch<0: raise ValueError('Invalid epoch')
    return {'model':copy.deepcopy(model.state_dict()),'optimizer':copy.deepcopy(optimizer.state_dict()),'epoch':epoch}`,
        String.raw`m=torch.nn.Linear(1,1); opt=torch.optim.Adam(m.parameters(),lr=0.01)
opt.zero_grad(); m(torch.ones(2,1)).sum().backward(); opt.step()
s=training_snapshot(m,opt,4); old=s['model']['weight'].clone()
with torch.no_grad(): m.weight.add_(100)
assert torch.equal(s['model']['weight'],old) and s['epoch']==4
new=torch.nn.Linear(1,1); new.load_state_dict(s['model']); other=torch.optim.Adam(new.parameters()); other.load_state_dict(s['optimizer'])
assert torch.equal(new.weight,old) and len(other.state)==2`,'torch'),
    task('TensorFlow','Easy','tf-tensor-axes','Reduce tensor features without merging examples',
        'Using TensorFlow 2.16+ in eager CPU mode, calculate the mean of each row of a nonempty floating tensor shaped (N,D), with D>0. Return shape (N,1), retaining a feature axis for later broadcasting. Demonstrate that reducing the whole tensor would mix unrelated examples.',
        'Choose reduction axes and preserve dimensions in TensorFlow tensor operations.',
        ['Use reduce_mean over axis 1 with keepdims=True.','Preserve the input floating dtype and never call NumPy inside the implementation.'],
        [['[[1,3],[10,20]]','[[2],[15]]'],['One row [[2,4,6]]','Shape (1,1), value 4']],
        ['axis=None reduces all examples and features together.','keepdims retains the reduced axis with size one.'],
        'Tensor axes express batch and feature semantics. Explicit reduction axes avoid accidentally sharing statistics between examples. Native TensorFlow operations retain tracing and differentiation support, unlike an eager conversion to a NumPy array.',
        String.raw`import tensorflow as tf
def row_mean(x):
    return tf.reduce_mean(x,axis=1,keepdims=True)`,
        String.raw`a=row_mean(tf.constant([[1.,3.],[10.,20.]],dtype=tf.float64))
assert a.shape==(2,1) and a.dtype==tf.float64
assert bool(tf.reduce_all(a==tf.constant([[2.],[15.]],dtype=tf.float64)))
assert row_mean(tf.constant([[2.,4.,6.]])).numpy().item()==4`,'tensorflow'),
    task('TensorFlow','Easy','tf-gradient-tape','Differentiate an eager scalar objective',
        'Implement a TensorFlow eager helper returning the derivative of mean((w*x-y)^2) with respect to scalar w. Assume nonempty aligned float32 tensors x and y. Track w with tf.Variable inside GradientTape and return a scalar gradient tensor without updating w.',
        'Record operations inside GradientTape and distinguish differentiation from optimization.',
        ['Create the objective inside the tape context.','Use mean squared error and return the derivative with its factor of two.'],
        [['w=0, x=[1,2], y=[2,4]','Gradient -10'],['w=2 with the same x and y','Gradient 0']],
        ['The tape records executed TensorFlow operations.','Analytically the gradient is mean(2*x*(w*x-y)).'],
        'GradientTape computes derivatives of the recorded objective with respect to watched variables. Constructing the loss outside the recording context loses the operation history. Computing a gradient does not itself update a parameter; an optimizer or assignment is a separate step.',
        String.raw`import tensorflow as tf
def scalar_mse_gradient(w,x,y):
    weight=tf.Variable(w,dtype=tf.float32)
    with tf.GradientTape() as tape:
        loss=tf.reduce_mean(tf.square(weight*x-y))
    return tape.gradient(loss,weight)`,
        String.raw`x=tf.constant([1.,2.]); y=tf.constant([2.,4.])
assert scalar_mse_gradient(0.,x,y).numpy().item()==-10
assert scalar_mse_gradient(2.,x,y).numpy().item()==0`,'tensorflow'),
    task('TensorFlow','Easy','tf-keras-logits','Build a Keras multiclass logits model',
        'Build a TensorFlow Keras model for four numeric input features and three mutually exclusive classes. Use an explicit Input, Dense(5,activation="relu"), then Dense(3) with no output activation. Return the built model and explain the sparse integer label and from_logits loss contract.',
        'Align Keras output shape and activation with multiclass classification.',
        ['Return a built model accepting (N,4) and producing (N,3).','Use a linear output suitable for SparseCategoricalCrossentropy(from_logits=True).'],
        [['Two rows of four features','Output shape (2,3)'],['All weights zero','Logits [0,0,0], corresponding probabilities each 1/3']],
        ['Input defines feature shape without including batch size.','A softmax output would require a different from_logits setting.'],
        'The three output units represent unnormalized class scores for one mutually exclusive label per row. Sparse categorical cross-entropy accepts integer class IDs, while categorical cross-entropy expects class distributions. A logits contract avoids applying softmax twice.',
        String.raw`import tensorflow as tf
def keras_classifier():
    return tf.keras.Sequential([tf.keras.Input(shape=(4,)),tf.keras.layers.Dense(5,activation='relu'),tf.keras.layers.Dense(3)])`,
        String.raw`m=keras_classifier(); assert m(tf.zeros((2,4))).shape==(2,3)
for weight in m.weights: weight.assign(tf.zeros_like(weight))
assert bool(tf.reduce_all(m(tf.ones((1,4)))==0)) and m.count_params()==43`,'tensorflow'),
    task('TensorFlow','Medium','tf-compile-update','Compile and verify a deterministic Keras training update',
        'Create a Keras single-weight regression model with one input, one linear unit, no bias, and zero initialization. Compile with SGD learning_rate=0.1 and mean squared error, train_on_batch for x=[[1],[2]], y=[[2],[4]], and return the trained model. Use the loss gradient to predict the expected parameter update.',
        'Connect compile configuration and batch training to a checkable optimizer step.',
        ['Use a scalar-output model with shape-matched float32 targets.','One batch update must move the weight from 0 to approximately 1.'],
        [['Initial weight 0 and supplied batch','Mean loss 10; gradient -10; new weight 1'],['Evaluate that model on the same batch','Mean loss 2.5, without another weight update']],
        ['SGD subtracts learning_rate times the mean-loss gradient.','Training metrics may describe the pre-update forward pass.'],
        'Keras compile binds optimizer and loss semantics, while train_on_batch performs an update. A hand-derived one-step fixture catches shape broadcasting and reduction errors without relying on a stochastic convergence claim. This training diagnostic is not held-out generalization evidence.',
        String.raw`import tensorflow as tf
def one_keras_update():
    model=tf.keras.Sequential([tf.keras.Input(shape=(1,)),tf.keras.layers.Dense(1,use_bias=False,kernel_initializer='zeros')])
    model.compile(optimizer=tf.keras.optimizers.SGD(learning_rate=0.1),loss='mse')
    model.train_on_batch(tf.constant([[1.],[2.]]),tf.constant([[2.],[4.]]))
    return model`,
        String.raw`m=one_keras_update(); assert abs(m.weights[0].numpy().item()-1)<1e-6
before=m.weights[0].numpy().copy(); loss=m.evaluate(tf.constant([[1.],[2.]]),tf.constant([[2.],[4.]]),verbose=0)
assert abs(loss-2.5)<1e-6 and (m.weights[0].numpy()==before).all()`,'tensorflow'),
    task('TensorFlow','Medium','tf-data-batches','Batch paired tensors with tf.data',
        'Return a finite tf.data.Dataset from aligned feature and target tensors using from_tensor_slices and batch(size,drop_remainder=False). Use eager CPU tensors, require a positive integer batch size, reject mismatched row counts, and retain deterministic original order. Do not repeat or pre-shuffle validation data.',
        'Construct a paired TensorFlow input pipeline with complete validation coverage.',
        ['Validate batch size and row alignment before building the dataset.','Keep a short final batch and preserve feature-target pairing.'],
        [['Five rows with batch_size=2','Batch sizes [2,2,1]'],['Mismatched feature and target counts','ValueError']],
        ['from_tensor_slices consumes matching leading dimensions.','Dropping the final batch would omit validation examples.'],
        'tf.data separates data iteration from Keras model execution. Batching must preserve paired labels and intentional coverage. Shuffle or augmentation can be useful for training, but validation needs a stable, representative pipeline with no training-only random transforms.',
        String.raw`import tensorflow as tf
def tensor_batches(x,y,size):
    if type(size) is not int or size<1 or len(x)!=len(y): raise ValueError('Invalid batch size or alignment')
    return tf.data.Dataset.from_tensor_slices((x,y)).batch(size,drop_remainder=False)`,
        String.raw`batches=list(tensor_batches(tf.range(5),tf.range(5)*10,2))
assert [len(x) for x,y in batches]==[2,2,1]
assert tf.concat([y for x,y in batches],axis=0).numpy().tolist()==[0,10,20,30,40]
try: tensor_batches(tf.range(3),tf.range(2),2)
except ValueError: pass
else: raise AssertionError('misaligned')`,'tensorflow'),
    task('TensorFlow','Medium','tf-early-stopping','Configure validation stopping and weight restoration',
        'Return a TensorFlow Keras EarlyStopping callback watching val_loss in min mode with patience=2, min_delta=0.01, and restore_best_weights=True. Show how it is supplied to fit with separate training and validation arrays. Never use a final test set as validation_data for stopping.',
        'Configure a callback that chooses and restores a validation checkpoint.',
        ['Use the exact monitoring, patience, and restoration settings.','The fit call must provide validation_data so val_loss exists; evaluate final test data only after selection.'],
        [['Validation losses 1.0,0.8,0.8,0.8','Best checkpoint at epoch 1; patience expires at epoch 3'],['No validation data in fit','val_loss is unavailable; configuration cannot perform intended monitoring']],
        ['Restore-best-weights is not enabled by default.','Stopping and checkpoint restoration happen at distinct callback lifecycle boundaries.'],
        'EarlyStopping is a validation-driven model-selection mechanism. In ordinary use pass this callback through model.fit(..., validation_data=(x_val,y_val), callbacks=[callback]); restore the best weights before independent final evaluation. Validation examples must follow the deployment split policy.',
        String.raw`import tensorflow as tf
def validation_stopper():
    return tf.keras.callbacks.EarlyStopping(monitor='val_loss',mode='min',patience=2,min_delta=0.01,restore_best_weights=True)
# Usage with an already compiled model:
# model.fit(x_train,y_train,validation_data=(x_val,y_val),callbacks=[validation_stopper()])`,
        String.raw`callback=validation_stopper()
assert callback.monitor=='val_loss' and callback.patience==2 and callback.restore_best_weights
assert abs(abs(callback.min_delta)-0.01)<1e-9
model=tf.keras.Sequential([tf.keras.Input(shape=(1,)),tf.keras.layers.Dense(1,use_bias=False)])
callback.set_model(model); callback.on_train_begin()
for epoch,loss in enumerate([1.0,0.8,0.8,0.8]):
    model.weights[0].assign(tf.ones_like(model.weights[0])*epoch)
    callback.on_epoch_end(epoch,{'val_loss':loss})
callback.on_train_end()
assert model.stop_training and model.weights[0].numpy().item()==1`,'tensorflow'),
    task('TensorFlow','Hard','tf-custom-step','Implement a clipped GradientTape training step',
        'Implement one eager TensorFlow regression training step for a built Keras model, optimizer, and nonempty shape-matched x/y tensors. Run the model with training=True, use mean squared error plus model.losses regularizers, calculate gradients, discard None gradients, clip by global norm 1, apply once, and return the pre-update scalar loss.',
        'Preserve regularization and gradient semantics in a custom training loop.',
        ['Include any model.losses terms within the taped objective.','Use clip_by_global_norm across all connected gradients and raise if none connect to the objective.'],
        [['Zero single weight, x=[[1]], y=[[10]], SGD lr=0.1','Gradient -20 clips to -1, new weight 0.1'],['A built model with L2 regularization','Returned loss includes the regularization term']],
        ['Keras automatically includes layer losses in fit; a custom loop must add them explicitly.','Global clipping scales all gradients together rather than clipping each component separately.'],
        'Custom loops assume responsibility for training flags, regularization, gradient filtering, and updates. This eager CPU reference deliberately omits mixed precision and distribution, which require additional loss-scaling and reduction rules. Evaluate using a separate training=False pass.',
        String.raw`import tensorflow as tf
def custom_train_step(model,optimizer,x,y):
    with tf.GradientTape() as tape:
        prediction=model(x,training=True)
        loss=tf.reduce_mean(tf.square(prediction-y))
        if model.losses: loss+=tf.add_n(model.losses)
    pairs=[(g,v) for g,v in zip(tape.gradient(loss,model.trainable_variables),model.trainable_variables) if g is not None]
    if not pairs: raise ValueError('No connected gradients')
    gradients,variables=zip(*pairs); clipped,_=tf.clip_by_global_norm(gradients,1.0)
    optimizer.apply_gradients(zip(clipped,variables))
    return loss`,
        String.raw`m=tf.keras.Sequential([tf.keras.Input(shape=(1,)),tf.keras.layers.Dense(1,use_bias=False,kernel_initializer='zeros')])
loss=custom_train_step(m,tf.keras.optimizers.SGD(0.1),tf.constant([[1.]]),tf.constant([[10.]]))
assert abs(loss.numpy().item()-100)<1e-6 and abs(m.weights[0].numpy().item()-0.1)<1e-6
r=tf.keras.Sequential([tf.keras.Input(shape=(1,)),tf.keras.layers.Dense(1,use_bias=False,kernel_initializer='ones',kernel_regularizer=tf.keras.regularizers.L2(0.5))])
assert abs(custom_train_step(r,tf.keras.optimizers.SGD(0.01),tf.constant([[1.]]),tf.constant([[1.]])).numpy().item()-0.5)<1e-6`,'tensorflow'),
    task('TensorFlow','Hard','tf-masked-layer','Write a serializable masked pooling layer',
        'Implement and register a Keras custom layer MaskedMean accepting values shaped (B,T,D) and an optional boolean (B,T) mask. Return the mean over valid timesteps; an all-padding sequence returns zeros. Support get_config-based reconstruction and an absent mask meaning all positions are valid. Assume T>0 and finite values.',
        'Make padding-aware TensorFlow layer behavior reusable and serializable.',
        ['Use divide_no_nan for empty valid sets and retain shape (B,D).','Register the class with Keras serialization and do not convert symbolic tensors to NumPy in call.'],
        [['Values [[[2],[100]]], mask [[true,false]]','[[2]]'],['No valid positions','An all-zero pooled vector']],
        ['Broadcast the mask along the feature axis.','A serializable layer needs a registered name and base-layer configuration.'],
        'Pooling without a mask makes output depend on padding length. A custom Keras layer keeps the operation inside the model graph and documents its empty-sequence policy. Registration allows trusted model artifacts to reconstruct the class when its defining module is imported.',
        String.raw`import tensorflow as tf
@tf.keras.utils.register_keras_serializable(package='Roadmap')
class MaskedMean(tf.keras.layers.Layer):
    def __init__(self,**kwargs):
        super().__init__(**kwargs); self.supports_masking=True
    def call(self,inputs,mask=None):
        if mask is None: return tf.reduce_mean(inputs,axis=1)
        weights=tf.cast(mask,inputs.dtype)[...,None]
        return tf.math.divide_no_nan(tf.reduce_sum(inputs*weights,axis=1),tf.reduce_sum(weights,axis=1))
    def compute_mask(self,inputs,mask=None): return None
    def get_config(self): return super().get_config()`,
        String.raw`layer=MaskedMean(name='pool'); x=tf.constant([[[2.],[100.]]])
assert layer(x,mask=tf.constant([[True,False]])).numpy().item()==2
assert layer(x,mask=tf.constant([[False,False]])).numpy().item()==0
copy=tf.keras.layers.deserialize(tf.keras.layers.serialize(layer))
assert copy.name=='pool' and copy(x).numpy().item()==51`,'tensorflow'),
    task('TensorFlow','Hard','tf-normalization-boundary','Keep adaptive preprocessing inside a train-only artifact',
        'Build a TensorFlow Keras regression model with a Normalization layer adapted only on a nonempty (N,2) training matrix. Follow it with a single linear output. Compile for MSE, fit one epoch using explicit separate validation_data, and return the model. Validation rows must not alter normalization means. Use finite float32 CPU arrays and no test data.',
        'Package fitted preprocessing with a Keras model without adapting on validation.',
        ['Call adapt only on training x and train with explicit validation_data.','Use shuffle=False for this deterministic fixture and a fixed Keras random seed.'],
        [['Training features [[0,2],[2,4]], validation [[100,100]]','Normalization mean remains [1,3]'],['Run inference after fit','Finite (N,1) predictions with the same normalization state']],
        ['adapt estimates preprocessing parameters independently of model.fit.','Concatenating training and validation before adapt leaks validation distribution statistics.'],
        'A learned preprocessing layer is part of the model artifact and the evaluation boundary. Validation may assess training and select settings, but cannot fit normalization state. This tiny one-epoch reference checks state isolation rather than asserting predictive quality or convergence.',
        String.raw`import tensorflow as tf
def train_normalized_regressor(x_train,y_train,x_val,y_val):
    tf.keras.utils.set_random_seed(19)
    normalization=tf.keras.layers.Normalization(axis=-1,name='train_normalization')
    normalization.adapt(x_train)
    model=tf.keras.Sequential([tf.keras.Input(shape=(2,)),normalization,tf.keras.layers.Dense(1)])
    model.compile(optimizer=tf.keras.optimizers.SGD(0.01),loss='mse')
    model.fit(x_train,y_train,validation_data=(x_val,y_val),epochs=1,batch_size=2,shuffle=False,verbose=0)
    return model`,
        String.raw`import numpy as np
x=np.array([[0,2],[2,4]],dtype=np.float32); y=np.array([[1],[3]],dtype=np.float32)
m=train_normalized_regressor(x,y,np.array([[100,100]],dtype=np.float32),np.array([[5]],dtype=np.float32))
assert np.allclose(m.get_layer('train_normalization').mean.numpy(),[[1,3]])
assert np.isfinite(m(x,training=False).numpy()).all() and m(x).shape==(2,1)`,'tensorflow'),
    task('CNN','Easy','conv-output-shape','Calculate convolution spatial dimensions',
        'Implement one-axis CNN output-size calculation for positive integer input size n, kernel k, stride s, dilation d, and nonnegative symmetric padding p. Use floor((n+2p−d(k−1)−1)/s)+1 and reject configurations yielding no output. This is explicit padding, not a framework’s automatic SAME policy.',
        'Trace spatial size through stride, dilation, and explicit padding.',
        ['Validate integer parameters and reject a nonpositive output size.','Use the effective kernel d*(k−1)+1 rather than ignoring dilation.'],
        [['n=7,k=3,s=2,p=1,d=1','4'],['n=7,k=3,s=1,p=0,d=2','3']],
        ['The effective kernel expands with dilation.','Count valid kernel starting positions after padding.'],
        'CNN spatial dimensions follow the effective receptive footprint and allowed starting positions. Automatic SAME padding instead chooses padding to obtain a target ceil(n/stride), potentially asymmetrically. Keeping the convention explicit avoids off-by-one architectural mismatches.',
        String.raw`def conv_size(n,k,s=1,p=0,d=1):
    if any(type(v) is not int for v in (n,k,s,p,d)) or min(n,k,s,d)<1 or p<0: raise ValueError('Invalid geometry')
    result=(n+2*p-d*(k-1)-1)//s+1
    if result<1: raise ValueError('Kernel has no valid placement')
    return result`,
        String.raw`assert conv_size(7,3,2,1)==4 and conv_size(7,3,d=2)==3
try: conv_size(2,5)
except ValueError: pass
else: raise AssertionError('impossible geometry')`),
    task('CNN','Easy','cross-correlation','Apply a single-channel image kernel',
        'Implement valid stride-one two-dimensional cross-correlation for a finite image and a kernel that fits inside it. Return a floating feature map. Match the operation commonly called convolution in CNN libraries: do not flip the kernel. Assume two-dimensional nonempty inputs.',
        'Relate a shared local kernel to entries of a feature map.',
        ['Compute each output as a window/kernel elementwise product sum.','Return shape (H−Kh+1,W−Kw+1) without padding or kernel reversal.'],
        [['Image [[1,2],[3,4]], kernel [[1,0],[0,-1]]','[[-3]]'],['Image [[1,2,3]], kernel [[1,2]]','[[5,8]]']],
        ['Slide the same kernel across every valid window.','Use an asymmetric kernel fixture to reveal accidental reversal.'],
        'CNN cross-correlation shares weights across spatial positions and produces one feature map per filter. Mathematical convolution reverses the kernel; most deep-learning layers use cross-correlation despite the conventional name. This direct loop is educational rather than optimized.',
        String.raw`import numpy as np
def correlate2d(image,kernel):
    x,k=np.asarray(image,dtype=float),np.asarray(kernel,dtype=float)
    h,w=x.shape; kh,kw=k.shape; result=np.empty((h-kh+1,w-kw+1))
    for i in range(result.shape[0]):
        for j in range(result.shape[1]): result[i,j]=np.sum(x[i:i+kh,j:j+kw]*k)
    return result`,
        String.raw`assert np.allclose(correlate2d([[1,2],[3,4]],[[1,0],[0,-1]]),[[-3]])
assert np.allclose(correlate2d([[1,2,3]],[[1,2]]),[[5,8]])`),
    task('CNN','Easy','max-pool','Downsample feature maps with nonoverlapping max pooling',
        'Implement 2×2 stride-two max pooling for a finite two-dimensional CNN feature map. Retain only complete windows, dropping an unmatched bottom row or right column. Require both dimensions at least two and avoid zero initialization that would corrupt entirely negative windows.',
        'Calculate pooling outputs and state the boundary policy.',
        ['Select a maximum for each complete 2×2 window.','Use floor-sized output and preserve negative maxima correctly.'],
        [['Feature map [[-4,-2],[-3,-5]]','[[-2]]'],['Three-by-three feature map','One pooled value; final row and column omitted']],
        ['A maximum of negative values remains negative.','Do not pad unless the problem explicitly requests a padding policy.'],
        'Max pooling reduces spatial resolution while preserving a strong local response. Dropping incomplete windows is an explicit design choice, and other libraries may offer ceil-mode or padding. Pooling has no learned weights but changes spatial information and receptive fields.',
        String.raw`import numpy as np
def pool2x2(feature):
    x=np.asarray(feature,dtype=float)
    if x.ndim!=2 or min(x.shape)<2: raise ValueError('Need a complete window')
    h,w=x.shape[0]//2,x.shape[1]//2
    return x[:2*h,:2*w].reshape(h,2,w,2).max(axis=(1,3))`,
        String.raw`assert pool2x2([[-4,-2],[-3,-5]]).tolist()==[[-2]]
assert pool2x2([[1,2,99],[3,4,99],[99,99,99]]).tolist()==[[4]]`),
    task('CNN','Medium','multi-channel-kernel','Contract channels into multiple feature maps',
        'Implement valid stride-one CNN cross-correlation for an input shaped (Cin,H,W), kernels (Cout,Cin,Kh,Kw), and biases (Cout,). Sum across all input channels for each output channel. Assume finite compatible inputs and kernels that fit; no batch axis, groups, or dilation.',
        'Keep input and output channels distinct in a convolution operation.',
        ['Return (Cout,H−Kh+1,W−Kw+1).','Add each output-channel bias once after summing channel/kernel products.'],
        [['Two input channels of ones, a 1×1 filter with channel weights 2 and 3, bias 1','Each output value is 6'],['Two filters with opposite weights and zero biases','Their output maps are negatives of each other']],
        ['A filter spans every input channel in an ordinary dense convolution.','Bias is per output channel, not per input channel contribution.'],
        'A standard convolution mixes local spatial evidence and all input channels into each output map. Parameter count depends on both channel counts, while spatial parameter sharing keeps it independent of image size. This reference uses explicit loops for transparent shape reasoning.',
        String.raw`import numpy as np
def channel_convolution(x,kernels,bias):
    x,kernels,bias=[np.asarray(v,dtype=float) for v in (x,kernels,bias)]
    cout,cin,kh,kw=kernels.shape; h,w=x.shape[1:]
    out=np.empty((cout,h-kh+1,w-kw+1))
    for c in range(cout):
        for i in range(out.shape[1]):
            for j in range(out.shape[2]): out[c,i,j]=np.sum(x[:,i:i+kh,j:j+kw]*kernels[c])+bias[c]
    return out`,
        String.raw`x=np.ones((2,2,2)); k=np.array([[[[2]],[[3]]]],dtype=float)
assert np.allclose(channel_convolution(x,k,[1]),6)
out=channel_convolution(x,np.concatenate([k,-k]),[0,0]); assert out.shape==(2,2,2) and np.allclose(out[0],-out[1])`),
    task('CNN','Medium','same-padding','Calculate asymmetric SAME padding',
        'Implement one-axis TensorFlow-style SAME padding for positive integer input size n, kernel k, and stride s, without dilation. Return (output_size,pad_before,pad_after), choosing ceil(n/s) output positions and placing any odd extra padding after the input. Do not assume padding is symmetric for stride greater than one.',
        'Translate an automatic padding convention into explicit geometry.',
        ['Use total=max((ceil(n/s)−1)*s+k−n,0).','Split total padding with floor(total/2) before and the remainder after.'],
        [['n=4,k=3,s=2','(2,0,1)'],['n=5,k=3,s=2','(3,1,1)']],
        ['First choose the target output size, then solve for total padding.','SAME refers to a convention; with stride two output size is approximately half.'],
        'Automatic padding controls output shape rather than guaranteeing equal padding on both sides. Asymmetric padding can shift alignment in encoder-decoder or residual architectures, so reproduce the exact convention when moving between implementations.',
        String.raw`def same_padding(n,k,s):
    if any(type(v) is not int or v<1 for v in (n,k,s)): raise ValueError('Positive integers required')
    out=(n+s-1)//s; total=max((out-1)*s+k-n,0)
    return out,total//2,total-total//2`,
        String.raw`assert same_padding(4,3,2)==(2,0,1)
assert same_padding(5,3,2)==(3,1,1)
assert same_padding(6,1,3)==(2,0,0)`),
    task('CNN','Medium','global-average','Replace flattening with global spatial averages',
        'For a CNN activation tensor shaped (N,C,H,W) with positive H and W, return global average pooled features (N,C). Explain how this differs from flattening before a dense classifier and why arbitrary input resolution still requires a compatible upstream feature extractor.',
        'Aggregate spatial responses without mixing channels or examples.',
        ['Average only spatial axes 2 and 3.','Preserve batch and channel axes even when either size is one.'],
        [['One channel [[1,3],[5,7]]','Pooled value 4'],['Shape (2,3,4,5)','Output shape (2,3)']],
        ['Specify the two spatial axes explicitly.','Flattening produces C*H*W features; pooling produces C.'],
        'Global averaging reduces classifier parameter count and allows spatial size variation at the pooling boundary. It discards spatial arrangement and does not automatically make all preceding operations resolution independent or invariant to arbitrary image transformations.',
        String.raw`import numpy as np
def global_average(feature):
    x=np.asarray(feature,dtype=float)
    if x.ndim!=4 or min(x.shape[2:])<1: raise ValueError('Nonempty NCHW spatial axes required')
    return x.mean(axis=(2,3))`,
        String.raw`assert global_average(np.array([[[[1,3],[5,7]]]])).tolist()==[[4]]
assert global_average(np.ones((2,3,4,5))).shape==(2,3)`),
    task('CNN','Hard','conv-input-gradient','Backpropagate overlapping convolution windows',
        'For a single-channel valid stride-one CNN cross-correlation and a supplied upstream gradient for its output, implement the gradient with respect to the input image. Assume finite compatible matrices. Accumulate overlapping window contributions rather than overwriting them, and verify by finite differences.',
        'Derive how shared local operations accumulate gradients at overlapping pixels.',
        ['Initialize an input-shaped zero gradient and add upstream*kernel into each input window.','Use the same unflipped-kernel forward convention as the objective under test.'],
        [['A 2×2 all-one kernel, upstream 2×2 all ones for a 3×3 image','Input gradient [[1,2,1],[2,4,2],[1,2,1]]'],['An asymmetric kernel and arbitrary upstream values','Finite differences match every input entry']],
        ['One input pixel may affect several output positions.','Test against a scalar sum of forward outputs times upstream gradients.'],
        'Backpropagation through cross-correlation adds contributions from every window that includes a pixel. The direct scatter-add derivation avoids ambiguity about flipped full convolutions. Numerical checking validates the chosen stride/padding convention on small inputs.',
        String.raw`import numpy as np
def convolution_input_gradient(input_shape,kernel,upstream):
    k=np.asarray(kernel,dtype=float); g=np.asarray(upstream,dtype=float); dx=np.zeros(input_shape,dtype=float)
    kh,kw=k.shape
    for i in range(g.shape[0]):
        for j in range(g.shape[1]): dx[i:i+kh,j:j+kw]+=g[i,j]*k
    return dx`,
        String.raw`assert np.allclose(convolution_input_gradient((3,3),np.ones((2,2)),np.ones((2,2))),[[1,2,1],[2,4,2],[1,2,1]])
x=np.arange(9,dtype=float).reshape(3,3)/10; k=np.array([[1.,2.],[-1.,0.5]]); g=np.array([[1.,-2.],[0.3,0.4]])
def objective(z): return sum(np.sum(z[i:i+2,j:j+2]*k)*g[i,j] for i in range(2) for j in range(2))
dx=convolution_input_gradient(x.shape,k,g)
for index in np.ndindex(x.shape):
    delta=np.zeros_like(x); delta[index]=1e-6
    assert np.isclose(dx[index],(objective(x+delta)-objective(x-delta))/2e-6,atol=1e-7)`),
    task('CNN','Hard','receptive-field','Track receptive field through a convolutional stack',
        'Given a list of one-dimensional layer descriptions (kernel,stride,dilation), return the theoretical receptive-field width and effective input jump of the final CNN feature map. Start with receptive field 1 and jump 1. Ignore padding for field width, and state that boundary outputs may include padded rather than observed pixels.',
        'Calculate how depth and stride expand theoretical spatial coverage.',
        ['Update field by (kernel−1)*dilation*current_jump before updating jump.','Validate positive integer geometry; an empty layer list returns (1,1).'],
        [['Layers [(3,1,1),(2,2,1),(3,1,1)]','Field 8, jump 2'],['Layers [(3,1,2)]','Field 5, jump 1']],
        ['A downstream kernel spans positions separated by the accumulated jump.','Receptive field is potential structural dependence, not a guarantee of equal learned influence.'],
        'Theoretical receptive fields describe possible input support and grow differently from output stride. Dilation expands support without extra sampled kernel positions. Actual effective influence depends on learned weights and nonlinearities, and boundary support may fall outside the real image.',
        String.raw`def receptive_field(layers):
    field=jump=1
    for kernel,stride,dilation in layers:
        if any(type(v) is not int or v<1 for v in (kernel,stride,dilation)): raise ValueError('Invalid layer')
        field+=(kernel-1)*dilation*jump
        jump*=stride
    return field,jump`,
        String.raw`assert receptive_field([(3,1,1),(2,2,1),(3,1,1)])==(8,2)
assert receptive_field([(3,1,2)])==(5,1) and receptive_field([])==(1,1)`),
    task('CNN','Hard','frozen-feature-step','Train a new head while freezing CNN backbone state',
        'Implement one CPU PyTorch transfer-learning step for a supplied CNN backbone mapping (N,C,H,W) to (N,F), and a new classifier head. Freeze all backbone parameters, keep backbone in eval mode so BatchNorm statistics do not drift, compute features without gradients, and update only the head with multiclass cross-entropy. Use supplied local modules; no pretrained downloads.',
        'Distinguish freezing gradients from freezing running statistics in transfer learning.',
        ['Set backbone requires_grad=False and backbone.eval(), while head.train().','Use an optimizer constructed only from head parameters and integer class targets.'],
        [['Backbone with BatchNorm and a linear head','Backbone weights/statistics unchanged; head weights update'],['After backward','Backbone gradients remain None']],
        ['requires_grad=False alone does not prevent BatchNorm running-statistic updates.','A later unfreezing stage needs a deliberate learning-rate, mode, and optimizer policy.'],
        'Frozen feature extraction trains a task-specific head while retaining a stable representation. Training the head cannot adapt the backbone to a shifted domain; evaluate that limitation on validation data. This scoped helper intentionally leaves the backbone frozen and in evaluation mode after the step.',
        String.raw`import torch
def frozen_feature_step(backbone,head,optimizer,x,targets):
    backbone.eval()
    for parameter in backbone.parameters(): parameter.requires_grad_(False); parameter.grad=None
    head.train(); optimizer.zero_grad(set_to_none=True)
    with torch.no_grad(): features=backbone(x)
    loss=torch.nn.functional.cross_entropy(head(features),targets)
    loss.backward(); optimizer.step()
    return loss.detach().item()`,
        String.raw`backbone=torch.nn.Sequential(torch.nn.BatchNorm2d(1),torch.nn.AdaptiveAvgPool2d(1),torch.nn.Flatten())
head=torch.nn.Linear(1,2)
with torch.no_grad(): head.weight.zero_(); head.bias.zero_()
before={k:v.clone() for k,v in backbone.state_dict().items()}; old=head.weight.detach().clone()
frozen_feature_step(backbone,head,torch.optim.SGD(head.parameters(),lr=0.1),torch.ones(4,1,2,2),torch.ones(4,dtype=torch.long))
assert all(torch.equal(v,before[k]) for k,v in backbone.state_dict().items())
assert all(p.grad is None and not p.requires_grad for p in backbone.parameters())
assert not torch.equal(old,head.weight) and not backbone.training and head.training`,'torch'),
    task('RNN','Easy','rnn-step','Compute one batched recurrent state',
        'Implement a vanilla RNN step h_new=tanh(x@Wx+h_previous@Wh+b). Assume finite compatible arrays x (B,D), previous state (B,H), Wx (D,H), Wh (H,H), and b (H,). Return a new (B,H) array and keep the previous state unchanged.',
        'Combine current input and recurrent history using explicit batch dimensions.',
        ['Use separate input and recurrent matrix products.','Apply tanh after adding both products and bias.'],
        [['x=[[1]], previous=[[0]], Wx=[[1]], Wh=[[2]], b=[0]','[[tanh(1)]]'],['All inputs, state, and bias zero','Zero new state']],
        ['The recurrent matrix maps hidden features to hidden features.','Do not overwrite h_previous in place.'],
        'An RNN shares one state-transition rule over sequence positions. The hidden state compresses past context and is not itself a probability distribution. Correct batch dimensions prevent one observation’s history from mixing into another’s.',
        String.raw`import numpy as np
def recurrent_step(x,h,wx,wh,b):
    return np.tanh(np.asarray(x)@wx+np.asarray(h)@wh+b)`,
        String.raw`h=np.array([[0.]]); out=recurrent_step([[1]],h,np.array([[1.]]),np.array([[2.]]),np.array([0.]))
assert np.allclose(out,[[np.tanh(1)]]) and h[0,0]==0
assert np.allclose(recurrent_step([[0]],h,np.ones((1,1)),np.ones((1,1)),np.zeros(1)),0)`),
    task('RNN','Easy','rnn-unroll','Unroll a recurrence in chronological order',
        'Implement a scalar-state RNN over a one-dimensional finite sequence: h_t=tanh(x_t+0.5*h_previous), starting at h=0. Return every state in chronological order, with an empty array for an empty sequence. Explain why reversing inputs generally changes the result.',
        'Recognize recurrence as a sequential, order-sensitive computation.',
        ['Carry the previous hidden value into each next step.','Return all states, not only the final state.'],
        [['Sequence [1,0]','[tanh(1),tanh(0.5*tanh(1))]'],['Empty sequence','Empty floating array']],
        ['Initialize state once before the loop.','Resetting state inside the loop would remove memory.'],
        'A recurrent transition reuses parameters while evolving state in time. Each state depends on the ordered prefix, so independently processing or sorting timesteps destroys sequence semantics. State resets between independent sequences must be intentional.',
        String.raw`import numpy as np
def unroll_scalar(sequence):
    h=0.0; states=[]
    for value in sequence:
        h=np.tanh(value+0.5*h); states.append(h)
    return np.asarray(states,dtype=float)`,
        String.raw`assert np.allclose(unroll_scalar([1,0]),[np.tanh(1),np.tanh(0.5*np.tanh(1))])
assert unroll_scalar([]).shape==(0,)
assert not np.isclose(unroll_scalar([1,0])[-1],unroll_scalar([0,1])[-1])`),
    task('RNN','Easy','rnn-final-valid','Select each sequence’s last real output',
        'Given finite RNN outputs shaped (B,T,H) and integer lengths shaped (B,) between 1 and T, return the hidden output at each row’s last valid timestep. Reject out-of-range or noninteger lengths. Do not use the final padded timestep for every sequence.',
        'Distinguish sequence lengths from padded storage dimensions.',
        ['Index each row at length−1 and return (B,H).','Validate lengths without silently truncating fractional values.'],
        [['Outputs [[[1],[2],[99]],[[3],[4],[5]]], lengths [2,3]','[[2],[5]]'],['A length 0 or 4 for T=3','ValueError']],
        ['Use row indices paired with lengths−1.','The last array position may be padding rather than valid context.'],
        'Padded batches store different sequence lengths in a common tensor shape. Selecting the last physical timestep can substitute padding-dependent states for actual sequence summaries. Empty sequences require a separate policy and are rejected in this contract.',
        String.raw`import numpy as np
def last_valid(outputs,lengths):
    x=np.asarray(outputs); lengths=np.asarray(lengths)
    if x.ndim!=3 or lengths.shape!=(len(x),) or not np.issubdtype(lengths.dtype,np.integer) or ((lengths<1)|(lengths>x.shape[1])).any(): raise ValueError('Invalid lengths')
    return x[np.arange(len(x)),lengths-1]`,
        String.raw`x=np.array([[[1],[2],[99]],[[3],[4],[5]]]); assert last_valid(x,[2,3]).tolist()==[[2],[5]]
for lengths in [[0,3],[2,4],[1.5,2]]:
    try: last_valid(x,lengths)
    except ValueError: pass
    else: raise AssertionError('invalid lengths')`),
    task('RNN','Medium','rnn-mask-transition','Keep padding out of recurrent state updates',
        'Implement batched scalar RNN recurrence over finite input (B,T) with a boolean valid mask of identical shape. Start each hidden state at zero and propose tanh(input+0.5*h); update only rows whose current mask is true. Return every state, including repeated states on padded timesteps.',
        'Use validity masks to prevent padding from changing a recurrent summary.',
        ['Apply the mask to the state update, not merely to the final metric.','Return (B,T), with each row independent and invalid steps retaining prior state.'],
        [['Inputs [[1,999]], mask [[true,false]]','Both output states equal tanh(1)'],['All mask values false','All output states zero']],
        ['Compute the proposed next state then select old versus proposed.','A large padding value is a useful adversarial fixture.'],
        'Masking transitions protects hidden state from padding content. It is distinct from masking a loss, which may leave the hidden representation contaminated. For a stateful service, unrelated users must still have independent state lifecycles and reset boundaries.',
        String.raw`import numpy as np
def masked_recurrence(inputs,valid):
    x=np.asarray(inputs,dtype=float); valid=np.asarray(valid,dtype=bool)
    h=np.zeros(len(x)); result=np.empty_like(x)
    for t in range(x.shape[1]):
        proposed=np.tanh(x[:,t]+0.5*h)
        h=np.where(valid[:,t],proposed,h); result[:,t]=h
    return result`,
        String.raw`assert np.allclose(masked_recurrence([[1,999]],[[True,False]]),[[np.tanh(1),np.tanh(1)]])
assert np.allclose(masked_recurrence([[2,3],[4,5]],[[False,False],[False,False]]),0)`),
    task('RNN','Medium','forecast-windows','Build next-step forecasting examples without future features',
        'From a finite one-dimensional chronological series and a positive integer window width, return contiguous feature windows and their immediately following targets. Split raw time periods and fit transforms before calling this training-window helper; do not randomly split overlapping windows for final evaluation.',
        'Align sequence-to-one forecast inputs with their future targets.',
        ['Each target at index i+width uses only indices i through i+width−1 as input.','Return correctly shaped empty arrays when there are no complete examples.'],
        [['Series [10,20,30,40], width=2','X=[[10,20],[20,30]], y=[30,40]'],['Series length equals width','X shape (0,width), y shape (0,)']],
        ['The number of examples is max(n−width,0).','Overlapping windows share observations and cannot justify an IID random split.'],
        'Window construction defines a forecast horizon and information boundary. Chronological evaluation must also respect label availability and feature fitting. Earlier observed history can legitimately provide context for later validation predictions, but future target values cannot enter the corresponding inputs.',
        String.raw`import numpy as np
def forecast_windows(series,width):
    if type(width) is not int or width<1: raise ValueError('Positive window width required')
    x=np.asarray(series,dtype=float); n=max(len(x)-width,0)
    windows=np.empty((n,width)); targets=np.empty(n)
    for i in range(n): windows[i]=x[i:i+width]; targets[i]=x[i+width]
    return windows,targets`,
        String.raw`x,y=forecast_windows([10,20,30,40],2)
assert x.tolist()==[[10,20],[20,30]] and y.tolist()==[30,40]
x,y=forecast_windows([1,2],2); assert x.shape==(0,2) and y.shape==(0,)`),
    task('RNN','Medium','recurrent-gradient-chain','Diagnose vanishing and exploding temporal gradients',
        'Implement the derivative of the final state with respect to the initial state for a scalar linear RNN h_t=a_t*h_previous+b_t. Given finite one-dimensional coefficients a_t, return their product; empty coefficients represent derivative one. Compare long chains with coefficients 0.5 and 2, and explain why clipping cannot restore vanished information.',
        'Relate temporal gradient magnitudes to repeated Jacobian products.',
        ['Use a product, not a sum of transition derivatives.','Document that nonlinear RNNs add activation derivatives and can vanish even when recurrent weights exceed one.'],
        [['Ten transitions of 0.5','Derivative 1/1024'],['Ten transitions of 2','Derivative 1024']],
        ['Apply the chain rule across every transition.','Gradient clipping limits large norms but does not amplify a missing signal.'],
        'Repeated temporal Jacobians multiply, producing shrinking or growing sensitivities. This linear illustration isolates the mechanism; real RNN behavior also depends on activations, directions, and input-dependent state. Gated cells and truncated backpropagation change the dynamics and training horizon rather than magically eliminating all gradient problems.',
        String.raw`import numpy as np
def temporal_derivative(coefficients):
    a=np.asarray(coefficients,dtype=float)
    if a.ndim!=1 or not np.isfinite(a).all(): raise ValueError('Finite vector required')
    return float(np.prod(a))`,
        String.raw`assert temporal_derivative([0.5]*10)==1/1024
assert temporal_derivative([2]*10)==1024 and temporal_derivative([])==1`),
    task('RNN','Hard','bptt-scalar','Backpropagate a final-state loss through time',
        'For a scalar RNN h_t=tanh(w*x_t+u*h_previous+b), h_initial=0, implement final squared loss (h_final−target)^2 and gradients with respect to w,u,b. Assume a nonempty finite sequence and finite scalar parameters. Sum shared-parameter contributions over all timesteps.',
        'Implement full backpropagation through time with a checkable recurrent chain.',
        ['Cache every hidden state including the initial zero.','Propagate the hidden gradient backward and verify all three parameter gradients numerically.'],
        [['A three-step sequence and nonzero recurrent weight','All parameter gradients match central differences'],['Target equals final hidden output','Zero loss and parameter gradients']],
        ['Start dh=2*(h_final−target).','At each step dz=dh*(1−h_t²), then dh=dz*u.'],
        'Shared parameters affect every timestep, so their gradients add across the unrolled computation. This full-history reference retains O(T) states; truncated backpropagation saves memory but omits longer gradient paths and must detach state intentionally.',
        String.raw`import numpy as np
def scalar_bptt(sequence,w,u,b,target):
    states=[0.0]
    for value in sequence: states.append(np.tanh(w*value+u*states[-1]+b))
    error=states[-1]-target; dh=2*error; dw=du=db=0.0
    for t in range(len(sequence)-1,-1,-1):
        dz=dh*(1-states[t+1]**2)
        dw+=dz*sequence[t]; du+=dz*states[t]; db+=dz; dh=dz*u
    return float(error**2),np.array([dw,du,db])`,
        String.raw`seq=[0.2,-0.3,0.7]; params=np.array([0.4,0.6,-0.1]); target=0.3
loss,g=scalar_bptt(seq,*params,target)
for i in range(3):
    delta=np.zeros(3); delta[i]=1e-6
    numerical=(scalar_bptt(seq,*(params+delta),target)[0]-scalar_bptt(seq,*(params-delta),target)[0])/2e-6
    assert np.isclose(g[i],numerical,atol=1e-7)
h=0
for x in seq: h=np.tanh(params[0]*x+params[1]*h+params[2])
assert scalar_bptt(seq,*params,h)[0]==0`),
    task('RNN','Hard','lstm-cell','Separate LSTM memory from exposed hidden state',
        'Implement an LSTM cell update from already computed finite gate logits i,f,o,g and previous memory c_previous, all equally shaped arrays. Apply sigmoid to i/f/o and tanh to candidate g; compute c=f*c_previous+i*g_candidate and h=o*tanh(c). Use numerically stable sigmoid and return (h,c). No peepholes or projection.',
        'Trace gated additive memory and distinguish it from the hidden output.',
        ['Apply the correct nonlinearity to each gate and preserve shapes.','Keep input memory unchanged and handle large positive/negative gate logits without overflow.'],
        [['All logits zero, previous memory 2','New memory 1; hidden 0.5*tanh(1)'],['Forget gate strongly off, input gate strongly off','Memory and hidden approximately zero']],
        ['Candidate g is not a sigmoid gate.','The memory path is additive, but gate derivatives still affect gradient propagation.'],
        'LSTM memory combines retained old content and gated candidate content. The output gate controls the exposed hidden state separately. The additive pathway helps long-range credit assignment but does not guarantee nonvanishing gradients for every parameter or sequence.',
        String.raw`import numpy as np
def lstm_cell(i,f,o,g,c_previous):
    def sigmoid(z):
        z=np.asarray(z,dtype=float); e=np.exp(-np.abs(z))
        return np.where(z>=0,1/(1+e),e/(1+e))
    c=sigmoid(f)*np.asarray(c_previous)+sigmoid(i)*np.tanh(g)
    return sigmoid(o)*np.tanh(c),c`,
        String.raw`h,c=lstm_cell(np.array([0.]),np.array([0.]),np.array([0.]),np.array([0.]),np.array([2.]))
assert np.allclose(c,[1]) and np.allclose(h,[0.5*np.tanh(1)])
with np.errstate(over='raise'):
    h,c=lstm_cell(np.array([-1000.]),np.array([-1000.]),np.array([1000.]),np.array([1.]),np.array([2.]))
assert np.allclose(c,0) and np.allclose(h,0)`),
    task('RNN','Hard','gru-convention','Implement a GRU with a stated reset-gate convention',
        'Implement a GRU variant with supplied reset and update logits r,z shaped (B,H), candidate input contribution xw+b shaped (B,H), previous hidden h, and recurrent candidate matrix U (H,H). Use candidate=tanh(input_contribution+(sigmoid(r)*h)@U), then new_h=sigmoid(z)*h+(1−sigmoid(z))*candidate. Do not silently substitute PyTorch’s reset-after-matmul convention.',
        'Identify gate placement and update convention rather than relying on a cell name.',
        ['Reset before the recurrent matrix multiplication exactly as stated.','Use stable sigmoid and interpret a near-one update gate as retaining old state.'],
        [['Zero logits, zero candidate input, h=[[2]], U=[[0]]','New hidden [[1]]'],['Update logits near +1000','Old hidden retained']],
        ['(r*h)@U generally differs from r*(h@U).','Published and framework GRUs can differ in gate ordering and reset placement.'],
        'GRU implementations require a precise equation contract for parameter portability. This reset-before-matmul variant differs from PyTorch’s documented candidate calculation. Saturated update gates trade adaptation against retention; no convention guarantees useful memory without task-specific training.',
        String.raw`import numpy as np
def gru_cell(reset_logits,update_logits,input_contribution,h,u):
    def sigmoid(z):
        z=np.asarray(z,dtype=float); e=np.exp(-np.abs(z))
        return np.where(z>=0,1/(1+e),e/(1+e))
    r=sigmoid(reset_logits); z=sigmoid(update_logits)
    candidate=np.tanh(input_contribution+(r*h)@u)
    return z*h+(1-z)*candidate`,
        String.raw`assert np.allclose(gru_cell(np.zeros((1,1)),np.zeros((1,1)),np.zeros((1,1)),np.array([[2.]]),np.zeros((1,1))),[[1]])
h=np.array([[2.,-1.]]); u=np.array([[1.,2.],[3.,4.]])
assert np.allclose(gru_cell(np.zeros_like(h),np.full_like(h,1000),np.zeros_like(h),h,u),h)
r=np.array([[0.,2.]]); z=np.zeros_like(h); sig=1/(1+np.exp(-r))
expected=0.5*h+0.5*np.tanh((sig*h)@u)
assert np.allclose(gru_cell(r,z,np.zeros_like(h),h,u),expected)`),
    task('Transformers','Easy','attention-scores','Scale query-key compatibility scores',
        'For one Transformer attention head, implement scaled dot-product scores Q@K.T/sqrt(d), with finite Q shaped (Tq,d) and K shaped (Tk,d), d>0. Return (Tq,Tk) without applying softmax or mixing in values. Assume compatible matrices.',
        'Identify the key dimension that controls attention score scaling.',
        ['Divide by sqrt of query/key feature width, not sequence length.','Support different query and key lengths, as in decoder cross-attention.'],
        [['Q=[[1,1]], K=[[1,1],[1,-1]]','[[sqrt(2),0]]'],['Q shape (2,4), K shape (3,4)','Score shape (2,3)']],
        ['Each query compares with every key.','Value features are not needed until weighted aggregation.'],
        'Attention scores measure compatibility before normalization. Scaling by sqrt(d) controls dot-product magnitude under common initialization assumptions; it does not make scores probabilities. Separate query and key sequence lengths support cross-attention between different streams.',
        String.raw`import numpy as np
def attention_scores(q,k):
    q,k=np.asarray(q,dtype=float),np.asarray(k,dtype=float)
    return q@k.T/np.sqrt(q.shape[1])`,
        String.raw`assert np.allclose(attention_scores([[1,1]],[[1,1],[1,-1]]),[[np.sqrt(2),0]])
assert attention_scores(np.ones((2,4)),np.ones((3,4))).shape==(2,3)`),
    task('Transformers','Easy','sinusoidal-position','Construct sinusoidal position features',
        'Implement the original paired sine/cosine positional representation for a nonnegative sequence length and positive even model width d. At dimension 2i use sin(pos/10000^(2i/d)); at 2i+1 use cosine with the same frequency. Return a finite (length,d) array, including length zero.',
        'Inject position information into otherwise position-agnostic attention inputs.',
        ['Pair each sine with a cosine sharing its frequency.','Validate integer length and even positive width.'],
        [['Position zero, d=4','[0,1,0,1]'],['length=2,d=4, position one','[sin(1),cos(1),sin(0.01),cos(0.01)]']],
        ['Generate even dimension indices 0,2,... for frequencies.','Sine and cosine pairs do not independently advance the exponent.'],
        'Self-attention without position information is permutation equivariant over tokens under compatible masks. Sinusoidal features supply an explicit position signal; learned or rotary alternatives have different behavior. The reference restricts width to even values for a simple paired contract.',
        String.raw`import numpy as np
def sinusoidal_positions(length,width):
    if type(length) is not int or length<0 or type(width) is not int or width<2 or width%2: raise ValueError('Nonnegative length and positive even width required')
    angles=np.arange(length)[:,None]/(10000**(np.arange(0,width,2,dtype=float)/width))
    out=np.empty((length,width)); out[:,0::2]=np.sin(angles); out[:,1::2]=np.cos(angles)
    return out`,
        String.raw`p=sinusoidal_positions(2,4)
assert np.allclose(p[0],[0,1,0,1]) and np.allclose(p[1],[np.sin(1),np.cos(1),np.sin(0.01),np.cos(0.01)])
assert sinusoidal_positions(0,4).shape==(0,4)
try: sinusoidal_positions(2,3)
except ValueError: pass
else: raise AssertionError('odd width')`),
    task('Transformers','Easy','causal-visibility','Combine causal visibility with key padding',
        'Given a boolean one-dimensional valid-token vector, construct a square Transformer decoder visibility mask. Query i may see key j only when j<=i and key j is valid. True means allowed, not blocked. Padded query rows are not suppressed here; their loss must be excluded separately.',
        'State mask polarity and separate future-token blocking from padding exclusion.',
        ['Return an L-by-L boolean matrix including the diagonal when the key is valid.','Handle an empty token sequence and do not accidentally allow future keys.'],
        [['Valid keys [true,true,false]','[[true,false,false],[true,true,false],[true,true,false]]'],['Empty validity vector','Mask shape (0,0)']],
        ['Compare column indices j against row indices i.','Framework APIs use different boolean mask polarities; convert explicitly at the boundary.'],
        'Decoder causality prevents access to future target tokens, while key padding suppresses nonexistent context. This mask defines True as allowed, matching the local reference contract; a framework can use the opposite polarity. Padded query outputs must still be ignored by the supervised objective.',
        String.raw`import numpy as np
def causal_visibility(valid_keys):
    valid=np.asarray(valid_keys,dtype=bool); length=len(valid)
    return (np.arange(length)[None,:]<=np.arange(length)[:,None]) & valid[None,:]`,
        String.raw`assert causal_visibility([True,True,False]).tolist()==[[True,False,False],[True,True,False],[True,True,False]]
assert causal_visibility([]).shape==(0,0)`),
    task('Transformers','Medium','masked-softmax','Define attention for a fully masked row',
        'Implement row-wise masked softmax for finite attention scores and an equally shaped boolean allowed mask. Invalid keys receive exactly zero weight. A row with no allowed keys returns all zeros instead of NaNs. Scores may be large; do not exponentiate an unshifted large positive score.',
        'Normalize attention safely under causal and padding masks.',
        ['Use row-max subtraction over allowed positions only.','Return zero for fully masked rows and do not modify scores or masks.'],
        [['Scores [[1000,1000]], allowed [[true,false]]','[[1,0]]'],['All keys masked','All-zero attention weights']],
        ['An all-masked maximum is -infinity and needs an explicit fallback.','Use a guarded division to avoid 0/0 for the empty row.'],
        'Masked softmax normalizes only legal keys. A fully masked row has no probability distribution; this reference deliberately chooses a zero-output convention rather than silently producing NaNs. Callers must keep such query positions out of loss and meaningful evaluation.',
        String.raw`import numpy as np
def masked_softmax(scores,allowed):
    s=np.asarray(scores,dtype=float); allowed=np.asarray(allowed,dtype=bool)
    masked=np.where(allowed,s,-np.inf); maximum=masked.max(axis=1,keepdims=True)
    maximum=np.where(np.isfinite(maximum),maximum,0.0)
    weights=np.exp(np.where(allowed,s-maximum,-np.inf)); total=weights.sum(axis=1,keepdims=True)
    return np.divide(weights,total,out=np.zeros_like(weights),where=total>0)`,
        String.raw`assert np.array_equal(masked_softmax([[1000,1000]],[[True,False]]),[[1,0]])
with np.errstate(over='raise',invalid='raise',divide='raise'):
    assert np.array_equal(masked_softmax([[1000,-1000]],[[False,False]]),[[0,0]])
assert np.allclose(masked_softmax([[1,1]],[[True,True]]),[[0.5,0.5]])`),
    task('Transformers','Medium','head-layout','Split and reassemble attention heads',
        'Implement NumPy helpers splitting Transformer features (B,T,D) into (B,heads,T,D/heads) and merging them back. Require positive integer heads dividing D. A reshape without the appropriate transpose is insufficient; preserve token order and feature chunks exactly.',
        'Manage multi-head layout transformations without scrambling token positions.',
        ['Split into (B,T,heads,head_width), then transpose token and head axes.','Implement the inverse transpose and reshape; reject incompatible head counts.'],
        [['Input arange(24) shaped (1,3,8), heads=2','Each head receives its four-feature slice for every token'],['Split then merge any compatible tensor','Exactly the original values and shape']],
        ['Write all four axis names before reshaping.','A round trip alone is insufficient; also inspect one head’s token slices.'],
        'Multi-head attention applies separate feature subspaces to the same ordered sequence. Layout bugs can preserve element counts and even round-trip while computing attention across the wrong axis. A semantic slice check complements inverse-shape checks.',
        String.raw`import numpy as np
def split_heads(x,heads):
    x=np.asarray(x); b,t,d=x.shape
    if type(heads) is not int or heads<1 or d%heads: raise ValueError('Head count must divide width')
    return x.reshape(b,t,heads,d//heads).transpose(0,2,1,3)
def merge_heads(x):
    b,h,t,d=x.shape
    return x.transpose(0,2,1,3).reshape(b,t,h*d)`,
        String.raw`x=np.arange(24).reshape(1,3,8); parts=split_heads(x,2)
assert np.array_equal(parts[0,0],x[0,:,:4]) and np.array_equal(parts[0,1],x[0,:,4:])
assert np.array_equal(merge_heads(parts),x)
try: split_heads(x,3)
except ValueError: pass
else: raise AssertionError('invalid heads')`),
    task('Transformers','Medium','cross-attention','Attend decoder queries to encoder memory',
        'Implement one-head unmasked cross-attention for finite Q (Ttarget,d), K (Tsource,d), V (Tsource,dv), with nonempty source and positive d. Return both softmax weights and weights@V. Target and source lengths may differ; keys and values must correspond to the same source positions.',
        'Distinguish decoder query positions from encoder memory positions.',
        ['Normalize each target query over source positions with stable softmax.','Return weights (Ttarget,Tsource) and output (Ttarget,dv).'],
        [['A zero query and two source values [2],[6]','Uniform weights [0.5,0.5], output [4]'],['Three target queries and two source tokens','Weights shape (3,2); each row sums to one']],
        ['Queries come from the decoder stream while keys and values come from encoder memory.','A decoder’s self-attention causal mask is separate from this source-attention operation.'],
        'Cross-attention lets each target position retrieve source information. Noncausal encoder source context can be valid when the entire source is available at prediction time; streaming tasks require a stricter availability policy. This minimal implementation omits projection matrices, multiple heads, and dropout.',
        String.raw`import numpy as np
def cross_attention(q,k,v):
    q,k,v=[np.asarray(a,dtype=float) for a in (q,k,v)]
    scores=q@k.T/np.sqrt(q.shape[1]); scores-=scores.max(axis=1,keepdims=True)
    weights=np.exp(scores); weights/=weights.sum(axis=1,keepdims=True)
    return weights,weights@v`,
        String.raw`weights,out=cross_attention([[0,0]],[[1,2],[3,4]],[[2],[6]])
assert np.allclose(weights,[[0.5,0.5]]) and np.allclose(out,[[4]])
w,o=cross_attention(np.ones((3,2)),np.ones((2,2)),np.ones((2,4)))
assert w.shape==(3,2) and o.shape==(3,4) and np.allclose(w.sum(axis=1),1)`),
    task('Transformers','Hard','kv-cache','Append and reuse autoregressive key-value state',
        'Implement a single-head, single-token decoder attention step from already projected q,k_new shaped (d,), v_new shaped (dv,), and prior finite caches K (L,d), V (L,dv). Append the current key/value and attend only to the cached prefix including current token. Return output and new independent caches. No padding, batching, or projection is included.',
        'Make incremental decoding equivalent to causal prefix attention without recomputing old keys.',
        ['Append along the sequence axis without mutating or dropping prior entries.','Verify incremental outputs against full causal attention at every prefix; caches belong to one sequence and model version.'],
        [['Empty cache and one current value [7]','Output [7], cache length one'],['Decode three projected tokens sequentially','Every output equals recomputed prefix attention']],
        ['The one-token query has no future keys because the cache contains only the prefix.','A positional encoding or rotation must be applied before caching under the same position convention as full decoding.'],
        'Key-value caching reuses previous projected context to reduce repeated computation during autoregressive decoding. It still grows memory with sequence length and requires correct per-request isolation. This kernel assumes positional transformations are already embedded in the supplied projected arrays.',
        String.raw`import numpy as np
def cached_attention_step(q,k_new,v_new,keys,values):
    keys=np.concatenate([keys,np.asarray(k_new)[None,:]],axis=0)
    values=np.concatenate([values,np.asarray(v_new)[None,:]],axis=0)
    scores=np.asarray(q)@keys.T/np.sqrt(len(q)); weights=np.exp(scores-scores.max()); weights/=weights.sum()
    return weights@values,keys,values`,
        String.raw`q=np.array([[1.,0.],[0.2,1.],[-0.3,0.7]]); k=q*0.8; v=np.array([[2.],[5.],[9.]])
keys=np.empty((0,2)); values=np.empty((0,1))
for i in range(3):
    old=keys.copy(); out,new_keys,values=cached_attention_step(q[i],k[i],v[i],keys,values)
    assert np.array_equal(keys,old) and len(new_keys)==i+1
    keys=new_keys; scores=q[i]@k[:i+1].T/np.sqrt(2); weights=np.exp(scores-scores.max()); weights/=weights.sum()
    assert np.allclose(out,weights@v[:i+1])
assert cached_attention_step([1],[2],[7],np.empty((0,1)),np.empty((0,1)))[0].tolist()==[7]`),
    task('Transformers','Hard','pre-norm-block','Trace a pre-normalized encoder block',
        'Implement a NumPy pre-layernorm Transformer block for finite X (T,D): Y=X+attention(LN(X)); output=Y+ReLU(LN(Y)@W1+b1)@W2+b2. Use per-token population variance and epsilon=1e-5, with no learned layernorm affine parameters or dropout. The supplied attention callable returns (T,D).',
        'Separate residual connections, token-wise normalization, and feed-forward mixing.',
        ['Normalize the feature axis of each token independently.','Preserve the residual path so zero attention and zero feed-forward branches return X exactly.'],
        [['Both branch outputs zero','Output exactly X'],['Constant feature vector per token','Normalization is finite because epsilon is included']],
        ['Pre-norm applies LN before each sublayer, not after adding the residual.','The feed-forward matrix acts independently at each position; attention supplies sequence interaction.'],
        'Pre-norm and post-norm blocks have different gradient paths and cannot be interchanged when reproducing a model. Per-token normalization avoids mixing unrelated positions. This explicit simplified block omits dropout and learned affine layernorm parameters to isolate structure.',
        String.raw`import numpy as np
def pre_norm_block(x,attention,w1,b1,w2,b2):
    def norm(z): return (z-z.mean(axis=-1,keepdims=True))/np.sqrt(z.var(axis=-1,keepdims=True)+1e-5)
    y=x+attention(norm(x))
    return y+np.maximum(norm(y)@w1+b1,0)@w2+b2`,
        String.raw`x=np.array([[1.,2.],[7.,7.]])
zero=lambda z: np.zeros_like(z)
out=pre_norm_block(x,zero,np.zeros((2,3)),np.zeros(3),np.zeros((3,2)),np.zeros(2))
assert np.array_equal(out,x) and np.isfinite(out).all()
out=pre_norm_block(x,lambda z:z,np.eye(2),np.zeros(2),np.eye(2),np.zeros(2))
assert np.isfinite(out).all() and out.shape==x.shape`),
    task('Transformers','Hard','causal-finetune-loss','Shift labels and mask prompt tokens for decoder fine-tuning',
        'Implement next-token cross-entropy for finite decoder logits shaped (B,T,V), integer token IDs (B,T), boolean valid mask (B,T), and boolean supervised-target mask (B,T). Logit position t predicts token t+1; average only pairs where both tokens are valid and the target position is supervised. Return 0.0 if no supervised pairs exist. Assume valid token IDs are in [0,V).',
        'Align causal language-model predictions and loss masks without supervising prompt or padding positions.',
        ['Shift logits left and targets/masks right; require both source and target positions valid.','Use stable log-sum-exp on selected rows and never shift twice if integrating a model that already shifts internally.'],
        [['Three valid tokens, only last token supervised, uniform V=4 logits','Loss log(4) using only the second logit row'],['No supervised targets or T=1','Loss 0.0']],
        ['A target mask refers to the token being predicted, not the input position.','Response-only training masks prompts in the loss while still allowing them as causal context.'],
        'Decoder fine-tuning requires agreement between tokenization, causal input visibility, and label shifting. Loss masking controls which targets train the model; it does not remove prompt context. Keep evaluation examples separate, deduplicate sequences across splits, and check model APIs because many causal-LM implementations already perform the shift.',
        String.raw`import numpy as np
def causal_finetune_loss(logits,tokens,valid,supervised):
    logits=np.asarray(logits,dtype=float); tokens=np.asarray(tokens); valid=np.asarray(valid,dtype=bool); supervised=np.asarray(supervised,dtype=bool)
    selected=valid[:,:-1]&valid[:,1:]&supervised[:,1:]
    if not selected.any(): return 0.0
    z=logits[:,:-1,:][selected]; labels=tokens[:,1:][selected]
    shifted=z-z.max(axis=1,keepdims=True)
    return float(np.mean(np.log(np.exp(shifted).sum(axis=1))-shifted[np.arange(len(labels)),labels]))`,
        String.raw`z=np.zeros((1,3,4)); tokens=np.array([[0,1,2]]); valid=np.ones((1,3),dtype=bool); supervised=np.array([[False,False,True]])
assert np.isclose(causal_finetune_loss(z,tokens,valid,supervised),np.log(4))
z[0,0]=[1000,-1000,0,0]; assert np.isclose(causal_finetune_loss(z,tokens,valid,supervised),np.log(4))
z[0,1]=[-1000,-1000,1000,-1000]; assert causal_finetune_loss(z,tokens,valid,supervised)==0
assert causal_finetune_loss(z[:,:1],tokens[:,:1],valid[:,:1],supervised[:,:1])==0
assert causal_finetune_loss(z,tokens,np.zeros_like(valid),supervised)==0`),
];
